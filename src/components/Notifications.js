import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from "firebase/firestore";

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(79,140,255,0.10)',
    padding: '28px 32px',
    minWidth: 400,
    maxWidth: 900,
    margin: '0 auto',
  },
  title: {
    fontWeight: 700,
    fontSize: 20,
    color: '#3358e6',
    marginBottom: 18,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 18,
  },
  th: {
    background: '#f7fafd',
    fontWeight: 600,
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    color: '#3358e6',
  },
  td: {
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    fontSize: 15,
    textAlign: 'left',
    cursor: 'pointer',
  },
  unread: {
    background: '#e3f0ff',
    fontWeight: 700,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.25)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    padding: '32px 36px',
    minWidth: 400,
    maxWidth: 500,
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    position: 'relative',
    fontSize: 16,
    textAlign: 'left',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 18,
    background: 'none',
    border: 'none',
    color: '#e53935',
    fontWeight: 700,
    fontSize: 22,
    cursor: 'pointer',
  },
  notifTitle: {
    fontWeight: 700,
    color: '#3358e6',
    fontSize: 18,
    marginBottom: 8,
  },
  notifTime: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  notifContent: {
    fontSize: 16,
    color: '#22336b',
    marginBottom: 10,
  },
};

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString('vi-VN');
}

function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "patient_notifications"), where("patientId", "==", user.email), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setNotifs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [showModal]);

  const handleShowDetail = async (n) => {
    setDetail(n);
    setShowModal(true);
    if (!n.read) {
      await updateDoc(doc(db, "patient_notifications", n.id), { read: true });
    }
  };
  const handleCloseModal = () => setShowModal(false);

  return (
    <div style={styles.card}>
      <div style={styles.title}>Thông báo</div>
      {loading ? <div>Đang tải...</div> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tiêu đề</th>
              <th style={styles.th}>Thời gian</th>
              <th style={styles.th}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {notifs.length === 0 ? (
              <tr><td colSpan={3}>Chưa có thông báo nào</td></tr>
            ) : notifs.map(n => (
              <tr key={n.id} style={!n.read ? styles.unread : {}} onClick={() => handleShowDetail(n)}>
                <td style={styles.td}>{n.title}</td>
                <td style={styles.td}>{formatTime(n.createdAt)}</td>
                <td style={styles.td}>{n.read ? 'Đã đọc' : 'Chưa đọc'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal chi tiết */}
      {showModal && detail && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={handleCloseModal}>&times;</button>
            <div style={styles.notifTitle}>{detail.title}</div>
            <div style={styles.notifTime}>{formatTime(detail.createdAt)}</div>
            <div style={styles.notifContent}>{detail.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications; 