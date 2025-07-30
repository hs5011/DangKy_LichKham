import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(79,140,255,0.10)',
    padding: '28px 32px',
    minWidth: 400,
    maxWidth: 1000,
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
  },
  btn: {
    background: '#fff',
    color: '#3358e6',
    border: '1px solid #3358e6',
    fontWeight: 600,
    fontSize: 14,
    borderRadius: 5,
    padding: '6px 14px',
    cursor: 'pointer',
    margin: '0 4px',
  },
  addBtn: {
    background: 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)',
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    fontSize: 15,
    borderRadius: 5,
    padding: '10px 24px',
    cursor: 'pointer',
    marginBottom: 18,
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
    marginBottom: 12,
  },
  select: {
    padding: '7px 10px',
    borderRadius: 5,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    width: '100%',
    marginBottom: 12,
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

const ROLES = [
  { value: 'patient', label: 'Bệnh nhân' },
  { value: 'doctor', label: 'Bác sĩ' },
  { value: 'admin', label: 'Quản trị viên' },
];

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  // Thêm state password
  const [form, setForm] = useState({ fullName: '', phone: '', ward: '', email: '', role: 'patient', password: '' });
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  // Thêm state và fetch wards
  const [wards, setWards] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
      setLoading(false);
    };
    fetchUsers();
  }, [showModal, message]);

  useEffect(() => {
    if (showModal) {
      const fetchWards = async () => {
        const snap = await getDocs(collection(db, "wards"));
        setWards(snap.docs.map(doc => doc.data().name));
      };
      fetchWards();
    }
  }, [showModal]);

  const openAdd = () => {
    setEditUser(null);
    setForm({ fullName: '', phone: '', ward: '', email: '', role: 'patient', password: '' });
    setMessage("");
    setShowModal(true);
  };
  const openEdit = (u) => {
    setEditUser(u);
    setForm({ fullName: u.fullName || '', phone: u.phone || '', ward: u.ward || '', email: u.email || u.id, role: u.role || 'patient' });
    setMessage("");
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage("");
    try {
      if (!form.fullName || !form.phone || !form.ward || !form.email || (!editUser && !form.password)) {
        setMessage("Vui lòng nhập đầy đủ thông tin!");
        return;
      }
      if (editUser) {
        await updateDoc(doc(db, "users", form.email), {
          fullName: form.fullName,
          phone: form.phone,
          ward: form.ward,
          role: form.role,
        });
        setMessage("Cập nhật thành công!");
      } else {
        // Gọi REST API Firebase Auth để tạo user
        const apiKey = "AIzaSyAw0mfgwDP1WSsgf_dzZR2XpUt0zGWIU4I";
        const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password, returnSecureToken: true })
        });
        const data = await resp.json();
        if (data.error) {
          setMessage("Lỗi tạo tài khoản Auth: " + data.error.message);
          return;
        }
        await setDoc(doc(db, "users", form.email), {
          fullName: form.fullName,
          phone: form.phone,
          ward: form.ward,
          role: form.role,
          email: form.email,
        });
        setMessage("Thêm tài khoản thành công!");
      }
      setShowModal(false);
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  const handleDelete = async (u) => {
    try {
      await deleteDoc(doc(db, "users", u.id));
      setMessage("Đã xóa tài khoản!");
      setConfirmDelete(null);
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>Quản lý tài khoản người dùng</div>
      <button style={styles.addBtn} onClick={openAdd}>+ Thêm tài khoản</button>
      {loading ? <div>Đang tải...</div> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Họ tên</th>
              <th style={styles.th}>SĐT</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phường/Xã</th>
              <th style={styles.th}>Quyền</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6}>Chưa có tài khoản nào</td></tr>
            ) : users.map(u => (
              <tr key={u.id}>
                <td style={styles.td}>{u.fullName}</td>
                <td style={styles.td}>{u.phone}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{u.ward}</td>
                <td style={styles.td}>{ROLES.find(r => r.value === u.role)?.label || u.role}</td>
                <td style={styles.td}>
                  <button style={styles.btn} onClick={() => openEdit(u)}>Sửa</button>
                  <button style={styles.btn} onClick={() => setConfirmDelete(u)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal thêm/sửa */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closeModal}>&times;</button>
            <h3>{editUser ? 'Sửa tài khoản' : 'Thêm tài khoản'}</h3>
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Họ tên:</label>
              <input style={styles.input} name="fullName" value={form.fullName} onChange={handleChange} required />
              <label style={styles.label}>Số điện thoại:</label>
              <input style={styles.input} name="phone" value={form.phone} onChange={handleChange} required />
              <label style={styles.label}>Phường/Xã:</label>
              <select style={styles.select} name="ward" value={form.ward} onChange={handleChange} required>
                <option value="">Chọn phường/xã</option>
                {wards.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <label style={styles.label}>Email:</label>
              <input style={styles.input} name="email" value={form.email} onChange={handleChange} required disabled={!!editUser} />
              {!editUser && (
                <>
                  <label style={styles.label}>Mật khẩu:</label>
                  <input style={styles.input} name="password" type="password" value={form.password} onChange={handleChange} required />
                </>
              )}
              <label style={styles.label}>Quyền:</label>
              <select style={styles.select} name="role" value={form.role} onChange={handleChange} required>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              {message && <div style={message.startsWith('Lỗi') ? styles.error : styles.success}>{message}</div>}
              <button type="submit" style={styles.btn}>{editUser ? 'Cập nhật' : 'Thêm mới'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Modal xác nhận xóa */}
      {confirmDelete && (
        <div style={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setConfirmDelete(null)}>&times;</button>
            <h3>Xác nhận xóa tài khoản?</h3>
            <div style={{marginBottom: 18}}>Bạn có chắc chắn muốn xóa tài khoản <b>{confirmDelete.fullName}</b> ({confirmDelete.id})?</div>
            <button style={styles.btn} onClick={() => handleDelete(confirmDelete)}>Xác nhận xóa</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement; 