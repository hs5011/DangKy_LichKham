const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Gửi thông báo đến một token cụ thể
exports.sendNotification = functions.https.onRequest(async (req, res) => {
  try {
    const { token, notification } = req.body;

    if (!token || !notification) {
      return res.status(400).json({ error: 'Thiếu token hoặc thông báo' });
    }

    const message = {
      token: token,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/logo192.png',
      },
      data: notification.data || {},
      webpush: {
        notification: {
          icon: notification.icon || '/logo192.png',
          badge: '/logo192.png',
          actions: [
            {
              action: 'open',
              title: 'Mở ứng dụng'
            },
            {
              action: 'close',
              title: 'Đóng'
            }
          ]
        },
        fcm_options: {
          link: notification.click_action || '/'
        }
      }
    };

    const response = await admin.messaging().send(message);
    
    res.json({ 
      success: true, 
      messageId: response,
      message: 'Thông báo đã được gửi thành công' 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Gửi thông báo hàng loạt
exports.sendNotificationBulk = functions.https.onRequest(async (req, res) => {
  try {
    const { tokens, notification } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0 || !notification) {
      return res.status(400).json({ error: 'Thiếu tokens hoặc thông báo' });
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/logo192.png',
      },
      data: notification.data || {},
      webpush: {
        notification: {
          icon: notification.icon || '/logo192.png',
          badge: '/logo192.png',
          actions: [
            {
              action: 'open',
              title: 'Mở ứng dụng'
            },
            {
              action: 'close',
              title: 'Đóng'
            }
          ]
        },
        fcm_options: {
          link: notification.click_action || '/'
        }
      }
    };

    // Gửi thông báo đến tất cả tokens
    const response = await admin.messaging().sendMulticast({
      tokens: tokens,
      ...message
    });

    const results = {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };

    res.json({ 
      success: true, 
      results: results,
      message: `Đã gửi thành công ${response.successCount}/${tokens.length} thông báo` 
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Cloud Function trigger khi có thông báo mới được tạo
exports.onNotificationCreated = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      console.log('Processing notification:', notification);
      
      // Chỉ xử lý thông báo có status = 'sending'
      if (notification.status !== 'sending') {
        console.log('Notification status is not sending, skipping...');
        return null;
      }

      const db = admin.firestore();
      
      if (notification.type === 'specific' && notification.targetPatient) {
        console.log('Sending notification to specific patient:', notification.targetPatient);
        // Gửi thông báo cho bệnh nhân cụ thể
        const tokenDoc = await db.collection('fcm_tokens').doc(notification.targetPatient).get();
        
        if (tokenDoc.exists) {
          const tokenData = tokenDoc.data();
          console.log('Found FCM token for patient:', notification.targetPatient);
          
          const message = {
            token: tokenData.token,
            notification: {
              title: notification.title,
              body: notification.content,
              icon: '/logo192.png',
            },
            data: {
              type: notification.type,
              notificationId: context.params.notificationId,
              timestamp: new Date().toISOString()
            },
            webpush: {
              notification: {
                icon: '/logo192.png',
                badge: '/logo192.png',
                actions: [
                  {
                    action: 'open',
                    title: 'Mở ứng dụng'
                  },
                  {
                    action: 'close',
                    title: 'Đóng'
                  }
                ]
              },
              fcm_options: {
                link: '/notifications'
              }
            }
          };

          const response = await admin.messaging().send(message);
          console.log('FCM message sent successfully:', response);
          
          // Cập nhật trạng thái thành công
          await snap.ref.update({ status: 'sent' });
        } else {
          console.log('No FCM token found for patient:', notification.targetPatient);
          await snap.ref.update({ 
            status: 'error',
            error: 'No FCM token found for patient' 
          });
        }
      } else if (notification.type === 'all') {
        console.log('Sending notification to all patients');
        // Gửi thông báo cho tất cả bệnh nhân
        const tokensSnapshot = await db.collection('fcm_tokens').get();
        const tokens = [];
        
        tokensSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userType === 'patient' || !data.userType) {
            tokens.push(data.token);
          }
        });

        console.log('Found FCM tokens for patients:', tokens.length);

        if (tokens.length > 0) {
          const message = {
            notification: {
              title: notification.title,
              body: notification.content,
              icon: '/logo192.png',
            },
            data: {
              type: notification.type,
              notificationId: context.params.notificationId,
              timestamp: new Date().toISOString()
            },
            webpush: {
              notification: {
                icon: '/logo192.png',
                badge: '/logo192.png',
                actions: [
                  {
                    action: 'open',
                    title: 'Mở ứng dụng'
                  },
                  {
                    action: 'close',
                    title: 'Đóng'
                  }
                ]
              },
              fcm_options: {
                link: '/notifications'
              }
            }
          };

          const response = await admin.messaging().sendMulticast({
            tokens: tokens,
            ...message
          });

          console.log('FCM multicast sent successfully:', response);

          // Cập nhật trạng thái thành công
          await snap.ref.update({ 
            status: 'sent',
            sentCount: response.successCount,
            totalCount: tokens.length
          });
        } else {
          console.log('No FCM tokens found for any patients');
          await snap.ref.update({ 
            status: 'error',
            error: 'No FCM tokens found for patients' 
          });
        }
      }

      return null;
    } catch (error) {
      console.error('Error processing notification:', error);
      
      // Cập nhật trạng thái lỗi
      await snap.ref.update({ 
        status: 'error',
        error: error.message 
      });
      
      return null;
    }
  }); 