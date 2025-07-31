import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

class FCMService {
  constructor() {
    this.messaging = messaging;
  }

  // Đăng ký token FCM cho user
  async registerToken(userId) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: 'BKsmKT61DVKTGKZ3YgrN14iSrUV5gnhzTiBxPhIx79uN7JAlWiPG-Y8RKdRdW1xsuEWHcjPVblf2lymn-hBZKqw' // VAPID key thực tế
        });
        
        if (token) {
          // Lưu token vào Firestore với thông tin user
          await setDoc(doc(db, 'fcm_tokens', userId), {
            token: token,
            userId: userId,
            createdAt: new Date(),
            platform: 'web',
            userType: 'patient' // Đánh dấu đây là token của bệnh nhân
          });
          console.log('FCM token registered successfully for:', userId);
          return token;
        }
      } else {
        console.log('Notification permission denied');
      }
      return null;
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return null;
    }
  }

  // Lấy token FCM của user
  async getToken(userId) {
    try {
      const tokenDoc = await getDoc(doc(db, 'fcm_tokens', userId));
      if (tokenDoc.exists()) {
        return tokenDoc.data().token;
      }
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Lắng nghe thông báo khi app đang mở
  onMessageListener() {
    return new Promise((resolve) => {
      onMessage(this.messaging, (payload) => {
        console.log('Message received:', payload);
        resolve(payload);
      });
    });
  }

  // Gửi thông báo đến một user cụ thể
  async sendNotificationToUser(userId, notification) {
    try {
      const token = await this.getToken(userId);
      if (!token) {
        throw new Error('User không có FCM token');
      }

      // Gửi thông báo qua Cloud Function
      const response = await fetch('https://us-central1-ql-lichkham.cloudfunctions.net/sendNotification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          notification: {
            title: notification.title,
            body: notification.content,
            icon: '/logo192.png',
            click_action: '/notifications',
            data: {
              type: notification.type,
              appointmentId: notification.appointmentId,
              timestamp: new Date().toISOString()
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi gửi thông báo');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Gửi thông báo đến nhiều user
  async sendNotificationToMultipleUsers(userIds, notification) {
    const results = [];
    for (const userId of userIds) {
      try {
        const result = await this.sendNotificationToUser(userId, notification);
        results.push({ userId, success: true, result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    return results;
  }

  // Gửi thông báo đến tất cả bệnh nhân
  async sendNotificationToAllPatients(notification) {
    try {
      // Lấy tất cả FCM tokens của bệnh nhân
      const tokensSnapshot = await getDocs(collection(db, 'fcm_tokens'));
      const tokens = [];
      
      tokensSnapshot.forEach((doc) => {
        const data = doc.data();
        // Kiểm tra xem user có phải là bệnh nhân không
        if (data.userType === 'patient' || !data.userType) {
          tokens.push(data.token);
        }
      });

      if (tokens.length === 0) {
        throw new Error('Không có bệnh nhân nào đăng ký nhận thông báo');
      }

      // Gửi thông báo đến tất cả tokens
      const response = await fetch('https://us-central1-ql-lichkham.cloudfunctions.net/sendNotificationBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: tokens,
          notification: {
            title: notification.title,
            body: notification.content,
            icon: '/logo192.png',
            click_action: '/notifications',
            data: {
              type: notification.type,
              timestamp: new Date().toISOString()
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi gửi thông báo hàng loạt');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification to all patients:', error);
      throw error;
    }
  }
}

export default new FCMService(); 