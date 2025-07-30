import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import fcmService from '../services/fcmService';

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: '#fff',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  success: {
    border: '1px solid #d4edda',
    color: '#155724',
    background: '#d4edda',
  },
  error: {
    border: '1px solid #f8d7da',
    color: '#721c24',
    background: '#f8d7da',
  },
  info: {
    border: '1px solid #d1ecf1',
    color: '#0c5460',
    background: '#d1ecf1',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    marginLeft: '8px',
  },
};

function FCMRegistration() {
  const [status, setStatus] = useState(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const registerFCM = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setStatus({ type: 'info', message: 'Đang đăng ký nhận thông báo...' });
        
        const token = await fcmService.registerToken(user.email);
        
        if (token) {
          setStatus({ 
            type: 'success', 
            message: 'Đã đăng ký nhận thông báo thành công!' 
          });
        } else {
          setStatus({ 
            type: 'error', 
            message: 'Không thể đăng ký nhận thông báo. Vui lòng cho phép thông báo trong trình duyệt.' 
          });
        }
      } catch (error) {
        console.error('Error registering FCM:', error);
        setStatus({ 
          type: 'error', 
          message: 'Lỗi đăng ký thông báo: ' + error.message 
        });
      }
    };

    // Đăng ký FCM khi user đăng nhập
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        registerFCM();
      }
    });

    return () => unsubscribe();
  }, []);

  // Tự động ẩn thông báo sau 5 giây
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!show || !status) return null;

  return (
    <div style={{...styles.container, ...styles[status.type]}}>
      <span>{status.message}</span>
      <button 
        style={styles.closeBtn} 
        onClick={() => setShow(false)}
      >
        ×
      </button>
    </div>
  );
}

export default FCMRegistration; 