import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(79,140,255,0.10)',
    padding: '28px 32px',
    minWidth: 400,
    maxWidth: 500,
    margin: '0 auto',
  },
  title: {
    fontWeight: 700,
    fontSize: 20,
    color: '#3358e6',
    marginBottom: 18,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 500,
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    padding: '7px 10px',
    borderRadius: 5,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    width: '100%',
    marginBottom: 4,
  },
  btn: {
    background: 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)',
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    fontSize: 15,
    borderRadius: 5,
    padding: '10px 28px',
    cursor: 'pointer',
    marginTop: 10,
  },
  error: {
    color: '#e53935',
    marginBottom: 10,
    fontWeight: 500,
  },
  success: {
    color: '#388e3c',
    marginBottom: 10,
    fontWeight: 500,
  },
};

const WARDS = [
  "Phường Bình Thạnh",
  "Phường An Khánh",
  "Phường Xuân Hoà",
  "Phường 1",
  "Phường 2",
  "Phường 3"
];

function PatientProfile() {
  const [info, setInfo] = useState({ fullName: '', phone: '', ward: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, "users", user.email);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setInfo({ ...snap.data(), email: user.email });
      } else {
        setInfo({ fullName: '', phone: user.phoneNumber || '', ward: '', email: user.email });
      }
      setLoading(false);
    };
    fetchInfo();
  }, []);

  const handleChange = e => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    try {
      const user = auth.currentUser;
      // Cập nhật Firestore
      await updateDoc(doc(db, "users", user.email), {
        fullName: info.fullName,
        ward: info.ward,
      });
      // Cập nhật mật khẩu nếu có
      if (newPassword) {
        await user.updatePassword(newPassword);
      }
      setMessage("Cập nhật thành công!");
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>Thông tin cá nhân</div>
      {loading ? <div>Đang tải...</div> : (
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Họ và tên:</label>
            <input style={styles.input} name="fullName" value={info.fullName} onChange={handleChange} required />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Số điện thoại:</label>
            <input style={styles.input} value={info.phone} disabled />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phường/Xã:</label>
            <select style={styles.input} name="ward" value={info.ward} onChange={handleChange} required>
              <option value="">Chọn Phường/Xã</option>
              {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email:</label>
            <input style={styles.input} value={info.email} disabled />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Mật khẩu mới (nếu muốn đổi):</label>
            <input style={styles.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          {message && <div style={message.startsWith('Lỗi') ? styles.error : styles.success}>{message}</div>}
          <button type="submit" style={styles.btn}>Cập nhật</button>
        </form>
      )}
    </div>
  );
}

export default PatientProfile; 