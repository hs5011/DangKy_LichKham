import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import fcmService from '../services/fcmService';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  button: {
    background: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
    marginBottom: '10px',
  },
  status: {
    padding: '10px',
    borderRadius: '4px',
    marginTop: '10px',
  },
  success: {
    background: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  error: {
    background: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
  info: {
    background: '#d1ecf1',
    color: '#0c5460',
    border: '1px solid #bee5eb',
  },
  warning: {
    background: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeaa7',
  },
};

function FCMTest() {
  const [status, setStatus] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        checkFCMToken(user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkFCMToken = async (email) => {
    try {
      const tokenDoc = await getDoc(doc(db, 'fcm_tokens', email));
      if (tokenDoc.exists()) {
        setToken(tokenDoc.data().token);
        setStatus({ type: 'success', message: 'FCM token đã được đăng ký' });
      } else {
        setStatus({ type: 'info', message: 'Chưa có FCM token' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Lỗi kiểm tra FCM token: ' + error.message });
    }
  };

  const registerFCM = async () => {
    if (!user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập trước' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Đang đăng ký FCM...' });
      const newToken = await fcmService.registerToken(user.email);
      if (newToken) {
        setToken(newToken);
        setStatus({ type: 'success', message: 'Đăng ký FCM thành công!' });
      } else {
        setStatus({ type: 'error', message: 'Không thể đăng ký FCM. Vui lòng cho phép thông báo.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Lỗi đăng ký FCM: ' + error.message });
    }
  };

  const testNotification = async () => {
    if (!user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập trước' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Đang gửi thông báo test...' });
      
      // Tạo thông báo test trong Firestore (không cần Cloud Function)
      await addDoc(collection(db, 'patient_notifications'), {
        title: 'Thông báo test',
        content: 'Đây là thông báo test từ admin - ' + new Date().toLocaleString(),
        patientId: user.email,
        read: false,
        createdAt: new Date(),
        notificationId: 'test-' + Date.now()
      });

      setStatus({ type: 'success', message: 'Đã gửi thông báo test! Kiểm tra tab Thông báo.' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Lỗi gửi thông báo test: ' + error.message });
    }
  };

  const testFCMDirect = async () => {
    if (!user) {
      setStatus({ type: 'error', message: 'Vui lòng đăng nhập trước' });
      return;
    }

    if (!token) {
      setStatus({ type: 'error', message: 'Vui lòng đăng ký FCM trước' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Đang gửi thông báo FCM trực tiếp...' });
      
      // Gửi thông báo trực tiếp qua FCM (không cần Cloud Function)
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': 'key=YOUR_SERVER_KEY', // Cần thay bằng Server Key thực tế
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: 'Thông báo FCM Test',
            body: 'Đây là thông báo FCM test - ' + new Date().toLocaleString(),
            icon: '/logo192.png',
          },
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Đã gửi thông báo FCM thành công!' });
      } else {
        setStatus({ type: 'error', message: 'Lỗi gửi FCM: ' + response.statusText });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Lỗi gửi FCM: ' + error.message });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>Test FCM Notification</div>
        
        <div style={{...styles.status, ...styles.warning}}>
          <strong>Lưu ý:</strong> Cloud Functions chưa được deploy. Thông báo sẽ chỉ hiển thị trong app.
        </div>
        
        <div>
          <strong>User:</strong> {user?.email || 'Chưa đăng nhập'}
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <strong>FCM Token:</strong> {token ? token.substring(0, 50) + '...' : 'Chưa có'}
        </div>

        <div style={{ marginTop: '20px' }}>
          <button style={styles.button} onClick={registerFCM}>
            Đăng ký FCM
          </button>
          
          <button style={styles.button} onClick={testNotification}>
            Gửi thông báo test (In-app)
          </button>
          
          <button style={styles.button} onClick={testFCMDirect}>
            Gửi FCM trực tiếp
          </button>
        </div>

        {status && (
          <div style={{...styles.status, ...styles[status.type]}}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default FCMTest; 