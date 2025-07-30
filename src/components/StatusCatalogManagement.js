import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(79,140,255,0.10)',
    padding: '28px 32px',
    minWidth: 400,
    maxWidth: 700,
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
  textarea: {
    padding: '7px 10px',
    borderRadius: 5,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    width: '100%',
    minHeight: '80px',
    resize: 'vertical',
    marginBottom: 12,
  },
  submitBtn: {
    background: 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    padding: '8px 20px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  message: {
    padding: '10px',
    borderRadius: 5,
    marginTop: '10px',
    fontWeight: 600,
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
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  initBtn: {
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    padding: '10px 20px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: '10px',
  },
};

// Dữ liệu mẫu cho danh mục trạng thái
const DEFAULT_STATUSES = [
  { code: 'pending', label: 'Chờ duyệt', description: 'Lịch khám đang chờ quản trị viên duyệt' },
  { code: 'approved', label: 'Đã duyệt', description: 'Lịch khám đã được quản trị viên duyệt' },
  { code: 'cancelled', label: 'Đã từ chối', description: 'Lịch khám đã bị từ chối' },
  { code: 'completed', label: 'Đã hoàn thành', description: 'Buổi khám đã hoàn thành' },
  { code: 'rescheduled', label: 'Đã dời lịch', description: 'Lịch khám đã được dời' },
];

function StatusCatalogManagement() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [formData, setFormData] = useState({ code: '', label: '', description: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const snap = await getDocs(collection(db, 'status_catalog'));
        const statusList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStatuses(statusList);
        
        // Nếu không có dữ liệu, tạo dữ liệu mẫu
        if (statusList.length === 0) {
          console.log('Không có dữ liệu trạng thái, tạo dữ liệu mẫu...');
        }
      } catch (error) {
        console.error('Error fetching statuses:', error);
        setMessage({ type: 'error', text: 'Lỗi khi tải dữ liệu: ' + error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchStatuses();
  }, []);

  const initializeDefaultStatuses = async () => {
    try {
      setLoading(true);
      for (const status of DEFAULT_STATUSES) {
        await addDoc(collection(db, 'status_catalog'), status);
      }
      // Refresh danh sách
      const snap = await getDocs(collection(db, 'status_catalog'));
      const statusList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStatuses(statusList);
      setMessage({ type: 'success', text: 'Đã tạo dữ liệu mẫu thành công!' });
    } catch (error) {
      console.error('Error initializing statuses:', error);
      setMessage({ type: 'error', text: 'Lỗi khi tạo dữ liệu mẫu: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingStatus(null);
    setFormData({ code: '', label: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditingStatus(s);
    setFormData({ code: s.code, label: s.label, description: s.description });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.label.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin!' });
      return;
    }

    try {
      if (editingStatus) {
        // Cập nhật
        await updateDoc(doc(db, 'status_catalog', editingStatus.id), {
          code: formData.code.trim(),
          label: formData.label.trim(),
          description: formData.description.trim(),
        });
        setMessage({ type: 'success', text: 'Cập nhật thành công!' });
      } else {
        // Thêm mới
        await addDoc(collection(db, 'status_catalog'), {
          code: formData.code.trim(),
          label: formData.label.trim(),
          description: formData.description.trim(),
        });
        setMessage({ type: 'success', text: 'Thêm mới thành công!' });
      }

      // Refresh danh sách
      const snap = await getDocs(collection(db, 'status_catalog'));
      const statusList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStatuses(statusList);
      closeModal();
    } catch (error) {
      console.error('Error saving status:', error);
      setMessage({ type: 'error', text: 'Lỗi: ' + error.message });
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa trạng thái "${s.label}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'status_catalog', s.id));
      setMessage({ type: 'success', text: 'Xóa thành công!' });
      
      // Refresh danh sách
      const snap = await getDocs(collection(db, 'status_catalog'));
      const statusList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStatuses(statusList);
    } catch (error) {
      console.error('Error deleting status:', error);
      setMessage({ type: 'error', text: 'Lỗi: ' + error.message });
    }
  };

  if (loading) {
    return (
      <div style={styles.card}>
        <div style={styles.title}>Quản lý danh mục trạng thái</div>
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.title}>Quản lý danh mục trạng thái</div>
      
      {statuses.length === 0 ? (
        <div style={styles.empty}>
          <p>Chưa có dữ liệu trạng thái nào.</p>
          <button style={styles.initBtn} onClick={initializeDefaultStatuses}>
            Tạo dữ liệu mẫu
          </button>
        </div>
      ) : (
        <>
          <button style={styles.addBtn} onClick={openAdd}>
            + Thêm trạng thái mới
          </button>
          
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Mã</th>
                <th style={styles.th}>Tên</th>
                <th style={styles.th}>Mô tả</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map(s => (
                <tr key={s.id}>
                  <td style={styles.td}>{s.code}</td>
                  <td style={styles.td}>{s.label}</td>
                  <td style={styles.td}>{s.description}</td>
                  <td style={styles.td}>
                    <button style={styles.btn} onClick={() => openEdit(s)}>
                      Sửa
                    </button>
                    <button 
                      style={{...styles.btn, background: '#e53935', color: '#fff', border: '1px solid #e53935'}} 
                      onClick={() => handleDelete(s)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {message && (
        <div style={{...styles.message, ...(message.type === 'success' ? styles.success : styles.error)}}>
          {message.text}
        </div>
      )}

      {/* Modal thêm/sửa */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closeModal}>&times;</button>
            <h3 style={{marginBottom: 20, color: '#22336b'}}>
              {editingStatus ? 'Sửa trạng thái' : 'Thêm trạng thái mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label style={styles.label}>Mã trạng thái:</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  placeholder="VD: pending"
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Tên trạng thái:</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.label}
                  onChange={e => setFormData({...formData, label: e.target.value})}
                  placeholder="VD: Chờ duyệt"
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Mô tả:</label>
                <textarea
                  style={styles.textarea}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả chi tiết về trạng thái này..."
                />
              </div>
              <button type="submit" style={styles.submitBtn}>
                {editingStatus ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusCatalogManagement; 