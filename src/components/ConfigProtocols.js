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

function ConfigProtocols() {
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProtocol, setEditProtocol] = useState(null);
  const [name, setName] = useState("");
  const [days, setDays] = useState(5);
  const [description, setDescription] = useState("");
  const [deleteProtocol, setDeleteProtocol] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProtocols = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "treatment_protocols"));
      setProtocols(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchProtocols();
  }, [showModal, deleteProtocol]);

  // Lọc dữ liệu
  const filteredProtocols = protocols.filter(p => {
    if (search) {
      const s = search.toLowerCase();
      if (!(p.name && p.name.toLowerCase().includes(s)) && !(p.description && p.description.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const openAdd = () => {
    setEditProtocol(null);
    setName("");
    setDays(5);
    setDescription("");
    setShowModal(true);
  };
  const openEdit = (p) => {
    setEditProtocol(p);
    setName(p.name);
    setDays(p.days);
    setDescription(p.description || "");
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!name.trim() || !days) return;
    if (editProtocol) {
      await updateDoc(doc(db, "treatment_protocols", editProtocol.id), { name, days, description });
      setMessage("Cập nhật phác đồ thành công!");
    } else {
      await addDoc(collection(db, "treatment_protocols"), { name, days, description });
      setMessage("Thêm phác đồ thành công!");
    }
    setShowModal(false);
    setTimeout(() => setMessage(""), 2500);
  };
  const handleDelete = async () => {
    if (deleteProtocol) {
      await deleteDoc(doc(db, "treatment_protocols", deleteProtocol.id));
      setDeleteProtocol(null);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>Quản lý phác đồ điều trị</div>
      {message && <div style={{color: '#3358e6', fontWeight: 600, marginBottom: 12}}>{message}</div>}
      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <label style={styles.filterLabel}>Tìm kiếm:
            <input type="text" style={styles.filterInput} placeholder="Tên phác đồ, mô tả" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
        </div>
      </div>
      <button style={{ ...styles.btn, ...styles.addBtn }} onClick={openAdd}>+ Thêm phác đồ</button>
      {loading ? <div>Đang tải...</div> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tên phác đồ</th>
              <th style={styles.th}>Số ngày</th>
              <th style={styles.th}>Mô tả</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProtocols.length === 0 ? (
              <tr><td colSpan={4}>Không có phác đồ phù hợp</td></tr>
            ) : filteredProtocols.map(p => (
              <tr key={p.id}>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.days}</td>
                <td style={styles.td}>{p.description}</td>
                <td style={styles.td}>
                  <button style={{ ...styles.btn, ...styles.edit }} onClick={() => openEdit(p)}>Sửa</button>
                  <button style={{ ...styles.btn, ...styles.delete }} onClick={() => setDeleteProtocol(p)}>Xóa</button>
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
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>{editProtocol ? "Sửa phác đồ" : "Thêm phác đồ"}</div>
            <label style={styles.label}>Tên phác đồ:</label>
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} />
            <label style={styles.label}>Số ngày:</label>
            <input style={styles.input} type="number" value={days} onChange={e => setDays(Number(e.target.value))} min={1} />
            <label style={styles.label}>Mô tả:</label>
            <input style={styles.input} value={description} onChange={e => setDescription(e.target.value)} />
            <button style={{ ...styles.btn, ...styles.addBtn, width: '100%', marginTop: 10 }} onClick={handleSave}>{editProtocol ? "Lưu" : "Thêm mới"}</button>
          </div>
        </div>
      )}
      {/* Modal xác nhận xóa */}
      {deleteProtocol && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setDeleteProtocol(null)}>&times;</button>
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>Xác nhận xóa phác đồ?</div>
            <div style={{marginBottom: 24}}>Bạn có chắc chắn muốn xóa phác đồ <b>{deleteProtocol.name}</b>?</div>
            <button style={{...styles.btn, ...styles.delete, minWidth: 90}} onClick={handleDelete}>Xác nhận xóa</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigProtocols; 