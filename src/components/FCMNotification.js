import React, { useEffect, useState } from 'react';
import fcmService from '../services/fcmService';

const styles = {
  notification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: '#fff',
    padding: '16px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1001,
    minWidth: '300px',
    maxWidth: '400px',
    border: '1px solid #e0e0e0',
    animation: 'slideIn 0.3s ease-out',
  },
  title: {
    fontWeight: 600,
    fontSize: '16px',
    color: '#333',
    marginBottom: '8px',
  },
  body: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  btn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  btnPrimary: {
    background: '#3358e6',
    color: '#fff',
  },
  btnSecondary: {
    background: '#f8f9fa',
    color: '#6c757d',
    border: '1px solid #dee2e6',
  },
  closeBtn: {
    position: 'absolute',
    top: '8px',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#999',
  },
  '@keyframes slideIn': {
    from: {
      transform: 'translateX(100%)',
      opacity: 0,
    },
    to: {
      transform: 'translateX(0)',
      opacity: 1,
    },
  },
};

function FCMNotification() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const handleMessage = (payload) => {
      console.log('Received FCM message:', payload);
      
      setNotification({
        title: payload.notification?.title || 'Thông báo mới',
        body: payload.notification?.body || 'Bạn có thông báo mới từ hệ thống',
        data: payload.data || {},
        timestamp: new Date(),
      });

      // Tự động ẩn sau 5 giây
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    };

    // Lắng nghe thông báo khi app đang mở
    fcmService.onMessageListener().then(handleMessage);

    return () => {
      // Cleanup nếu cần
    };
  }, []);

  const handleClose = () => {
    setNotification(null);
  };

  const handleOpen = () => {
    // Mở trang thông báo hoặc trang liên quan
    if (notification?.data?.click_action) {
      window.location.href = notification.data.click_action;
    } else {
      window.location.href = '/notifications';
    }
    setNotification(null);
  };

  if (!notification) return null;

  return (
    <div style={styles.notification}>
      <button style={styles.closeBtn} onClick={handleClose}>
        ×
      </button>
      
      <div style={styles.title}>{notification.title}</div>
      <div style={styles.body}>{notification.body}</div>
      
      <div style={styles.actions}>
        <button 
          style={{...styles.btn, ...styles.btnSecondary}} 
          onClick={handleClose}
        >
          Đóng
        </button>
        <button 
          style={{...styles.btn, ...styles.btnPrimary}} 
          onClick={handleOpen}
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

export default FCMNotification; 