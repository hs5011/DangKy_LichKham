import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import fcmService from '../services/fcmService';

const styles = {
  container: {
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#22336b',
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    fontWeight: 500,
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
    minHeight: '100px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
  },
  btn: {
    background: '#3358e6',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginRight: '10px',
  },
  btnSecondary: {
    background: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  message: {
    padding: '10px',
    borderRadius: 6,
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '16px',
  },
  th: {
    background: '#f8f9fa',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #dee2e6',
    fontWeight: 600,
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
  },
  tabs: {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '1px solid #dee2e6',
  },
  tab: isActive => ({
    padding: '10px 20px',
    border: 'none',
    background: 'none',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#3358e6' : '#6c757d',
    borderBottom: isActive ? '2px solid #3358e6' : '2px solid transparent',
    cursor: 'pointer',
  }),
};

function SendNotification() {
  const [activeTab, setActiveTab] = useState('send');
  const [notificationType, setNotificationType] = useState('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patients, setPatients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Lấy danh sách bệnh nhân
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('fullName'));
        const snap = await getDocs(q);
        const patientList = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.role === 'patient' || !user.role);
        setPatients(patientList);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };
    fetchPatients();
  }, []);

  // Lấy lịch sử thông báo
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const notificationList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notificationList);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ tiêu đề và nội dung!' });
      return;
    }

    setLoading(true);
    try {
      const notificationData = {
        title: title.trim(),
        content: content.trim(),
        type: notificationType,
        targetPatient: notificationType === 'specific' ? selectedPatient : null,
        createdAt: serverTimestamp(),
        status: 'sending',
      };

      // Lưu thông báo vào Firestore
      const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
      
      // Cloud Function sẽ tự động xử lý việc gửi thông báo FCM
      // khi có document mới được tạo với status = 'sending'
      
      if (notificationType === 'specific') {
        // Gửi cho bệnh nhân cụ thể
        if (!selectedPatient) {
          throw new Error('Vui lòng chọn bệnh nhân!');
        }
        
        // Lấy thông tin bệnh nhân
        const selectedPatientData = patients.find(p => p.id === selectedPatient);
        if (!selectedPatientData) {
          throw new Error('Không tìm thấy thông tin bệnh nhân!');
        }

        // Cập nhật thông báo với targetPatient
        await updateDoc(doc(db, 'notifications', notificationRef.id), {
          targetPatient: selectedPatientData.email
        });

        // Lưu thông báo cho bệnh nhân cụ thể
        await addDoc(collection(db, 'patient_notifications'), {
          title: notificationData.title,
          content: notificationData.content,
          patientId: selectedPatientData.email,
          read: false,
          createdAt: serverTimestamp(),
          notificationId: notificationRef.id
        });

      } else {
        // Gửi cho tất cả bệnh nhân
        const allPatients = patients.filter(user => user.role === 'patient' || !user.role);
        for (const patient of allPatients) {
          await addDoc(collection(db, 'patient_notifications'), {
            title: notificationData.title,
            content: notificationData.content,
            patientId: patient.email,
            read: false,
            createdAt: serverTimestamp(),
            notificationId: notificationRef.id
          });
        }
      }
      
      setMessage({ type: 'success', text: 'Gửi thông báo thành công!' });
      setTitle('');
      setContent('');
      setSelectedPatient('');
      setNotificationType('all');
      
      // Refresh danh sách thông báo
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const notificationList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationList);
    } catch (error) {
      console.error('Error sending notification:', error);
      setMessage({ type: 'error', text: 'Lỗi: ' + error.message });
    }
    setLoading(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabs}>
        <button 
          style={styles.tab(activeTab === 'send')} 
          onClick={() => setActiveTab('send')}
        >
          Gửi thông báo
        </button>
        <button 
          style={styles.tab(activeTab === 'history')} 
          onClick={() => setActiveTab('history')}
        >
          Lịch sử thông báo
        </button>
      </div>

      {activeTab === 'send' && (
        <div style={styles.card}>
          <h3 style={styles.title}>Gửi thông báo</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Loại thông báo:</label>
              <select 
                style={styles.select}
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
              >
                <option value="all">Gửi cho tất cả bệnh nhân</option>
                <option value="specific">Gửi cho bệnh nhân cụ thể</option>
              </select>
            </div>

            {notificationType === 'specific' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Chọn bệnh nhân:</label>
                <select 
                  style={styles.select}
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  required
                >
                  <option value="">Chọn bệnh nhân</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Tiêu đề thông báo:</label>
              <input
                type="text"
                style={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề thông báo"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nội dung thông báo:</label>
              <textarea
                style={styles.textarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung thông báo chi tiết..."
                required
              />
            </div>

            <button 
              type="submit" 
              style={styles.btn}
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </form>

          {message && (
            <div style={{...styles.message, ...(message.type === 'success' ? styles.success : styles.error)}}>
              {message.text}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={styles.card}>
          <h3 style={styles.title}>Lịch sử thông báo</h3>
          {notifications.length === 0 ? (
            <p>Chưa có thông báo nào được gửi.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Thời gian</th>
                  <th style={styles.th}>Tiêu đề</th>
                  <th style={styles.th}>Nội dung</th>
                  <th style={styles.th}>Loại</th>
                  <th style={styles.th}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(notification => (
                  <tr key={notification.id}>
                    <td style={styles.td}>{formatDate(notification.createdAt)}</td>
                    <td style={styles.td}>{notification.title}</td>
                    <td style={styles.td}>{notification.content}</td>
                    <td style={styles.td}>
                      {notification.type === 'all' ? 'Tất cả bệnh nhân' : 'Bệnh nhân cụ thể'}
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        color: notification.status === 'sent' ? '#28a745' : '#ffc107',
                        fontWeight: 600 
                      }}>
                        {notification.status === 'sent' ? 'Đã gửi' : 'Đang gửi'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default SendNotification; 