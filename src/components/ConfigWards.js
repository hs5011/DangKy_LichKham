import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

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
  },
  filterBox: {
    background: '#f7fafd',
    borderRadius: 12,
    border: '1px solid #bfc9d9',
    padding: '18px 24px',
    marginBottom: 22,
    display: 'inline-block',
    boxShadow: '0 2px 8px rgba(79,140,255,0.06)',
  },
  filterRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontWeight: 500,
    fontSize: 15,
    marginRight: 12,
  },
  filterInput: {
    padding: '6px 10px',
    borderRadius: 5,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    minWidth: 120,
    marginLeft: 8,
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
    padding: '6px 16px',
    borderRadius: 5,
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    margin: '0 4px',
  },
  addBtn: {
    background: 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)',
    color: '#fff',
    marginBottom: 18,
  },
  edit: {
    background: '#fffbe6',
    color: '#22336b',
    border: '1px solid #ffe58f',
  },
  delete: {
    background: '#e53935',
    color: '#fff',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.18)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: '#fff',
    borderRadius: 10,
    padding: '28px 32px',
    minWidth: 340,
    maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    position: 'relative',
    textAlign: 'center',
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
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    marginBottom: 14,
    background: '#f7fafd',
  },
  label: {
    fontWeight: 500,
    marginBottom: 8,
    textAlign: 'left',
  },
};

function ConfigWards() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWard, setEditWard] = useState(null);
  const [name, setName] = useState("");
  const [deleteWard, setDeleteWard] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchWards = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "wards"));
      setWards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchWards();
  }, [showModal, deleteWard]);

  // Lọc dữ liệu
  const filteredWards = wards.filter(w => {
    if (search) {
      const s = search.toLowerCase();
      if (!(w.name && w.name.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const openAdd = () => {
    setEditWard(null);
    setName("");
    setShowModal(true);
  };
  
  const openEdit = (w) => {
    setEditWard(w);
    setName(w.name);
    setShowModal(true);
  };
  
  const handleSave = async () => {
    if (!name.trim()) return;
    if (editWard) {
      await updateDoc(doc(db, "wards", editWard.id), { name });
      setMessage("Cập nhật phường/xã thành công!");
    } else {
      await addDoc(collection(db, "wards"), { name });
      setMessage("Thêm phường/xã thành công!");
    }
    setShowModal(false);
    setTimeout(() => setMessage(""), 2500);
  };
  
  const handleDelete = async () => {
    if (deleteWard) {
      await deleteDoc(doc(db, "wards", deleteWard.id));
      setDeleteWard(null);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>Quản lý phường/xã</div>
      {message && <div style={{color: '#3358e6', fontWeight: 600, marginBottom: 12}}>{message}</div>}
      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <label style={styles.filterLabel}>Tìm kiếm:
            <input type="text" style={styles.filterInput} placeholder="Tên phường/xã" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
        </div>
      </div>
      <button style={{ ...styles.btn, ...styles.addBtn }} onClick={openAdd}>+ Thêm phường/xã</button>
      {loading ? <div>Đang tải...</div> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tên phường/xã</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredWards.length === 0 ? (
              <tr><td colSpan={2}>Không có phường/xã phù hợp</td></tr>
            ) : filteredWards.map(w => (
              <tr key={w.id}>
                <td style={styles.td}>{w.name}</td>
                <td style={styles.td}>
                  <button style={{ ...styles.btn, ...styles.edit }} onClick={() => openEdit(w)}>Sửa</button>
                  <button style={{ ...styles.btn, ...styles.delete }} onClick={() => setDeleteWard(w)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal thêm/sửa */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>{editWard ? "Sửa phường/xã" : "Thêm phường/xã"}</div>
            <label style={styles.label}>Tên phường/xã:</label>
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} />
            <button style={{ ...styles.btn, ...styles.addBtn, width: '100%', marginTop: 10 }} onClick={handleSave}>{editWard ? "Lưu" : "Thêm mới"}</button>
          </div>
        </div>
      )}
      {/* Modal xác nhận xóa */}
      {deleteWard && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setDeleteWard(null)}>&times;</button>
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>Xác nhận xóa phường/xã?</div>
            <div style={{marginBottom: 24}}>Bạn có chắc chắn muốn xóa phường/xã <b>{deleteWard.name}</b>?</div>
            <button style={{...styles.btn, ...styles.delete, minWidth: 90}} onClick={handleDelete}>Xác nhận xóa</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigWards; 