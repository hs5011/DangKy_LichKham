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
};

function ConfigClinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClinic, setEditClinic] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [deleteClinic, setDeleteClinic] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "clinics"));
      setClinics(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchClinics();
  }, [showModal, deleteClinic]);

  const openAdd = () => {
    setEditClinic(null);
    setName("");
    setDescription("");
    setActive(true);
    setShowModal(true);
  };
  const openEdit = (c) => {
    setEditClinic(c);
    setName(c.name);
    setDescription(c.description || "");
    setActive(c.active !== false);
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!name.trim()) return;
    if (editClinic) {
      await updateDoc(doc(db, "clinics", editClinic.id), { name, description, active });
      setMessage("Cập nhật phòng khám thành công!");
    } else {
      await addDoc(collection(db, "clinics"), { name, description, active });
      setMessage("Thêm phòng khám thành công!");
    }
    setShowModal(false);
    setTimeout(() => setMessage(""), 2500);
  };
  const handleDelete = async () => {
    if (deleteClinic) {
      await deleteDoc(doc(db, "clinics", deleteClinic.id));
      setDeleteClinic(null);
    }
  };

  // Lọc dữ liệu
  const filteredClinics = clinics.filter(c => {
    if (filterStatus && (filterStatus === "1" ? c.active === false : c.active !== false)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(c.name && c.name.toLowerCase().includes(s)) && !(c.description && c.description.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  return (
    <div style={styles.card}>
      <div style={styles.title}>Quản lý phòng khám</div>
      {message && <div style={{color: '#3358e6', fontWeight: 600, marginBottom: 12}}>{message}</div>}
      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <label style={styles.filterLabel}>Trạng thái:
            <select style={styles.filterInput} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="0">Hoạt động</option>
              <option value="1">Ngừng hoạt động</option>
            </select>
          </label>
          <label style={styles.filterLabel}>Tìm kiếm:
            <input type="text" style={styles.filterInput} placeholder="Tên phòng/Mô tả" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
        </div>
      </div>
      <button style={{ ...styles.btn, ...styles.addBtn }} onClick={openAdd}>+ Thêm phòng khám</button>
      {loading ? <div>Đang tải...</div> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tên phòng khám</th>
              <th style={styles.th}>Mô tả</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredClinics.length === 0 ? (
              <tr><td colSpan={4}>Không có phòng khám phù hợp</td></tr>
            ) : filteredClinics.map(c => (
              <tr key={c.id}>
                <td style={styles.td}>{c.name}</td>
                <td style={styles.td}>{c.description}</td>
                <td style={styles.td}>{c.active !== false ? "Hoạt động" : "Ngừng hoạt động"}</td>
                <td style={styles.td}>
                  <button style={{ ...styles.btn, ...styles.edit }} onClick={() => openEdit(c)}>Sửa</button>
                  <button style={{ ...styles.btn, ...styles.delete }} onClick={() => setDeleteClinic(c)}>Xóa</button>
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
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>{editClinic ? "Sửa phòng khám" : "Thêm phòng khám"}</div>
            <label style={styles.label}>Tên phòng khám:</label>
            <input style={styles.input} value={name} onChange={e => setName(e.target.value)} />
            <label style={styles.label}>Mô tả:</label>
            <input style={styles.input} value={description} onChange={e => setDescription(e.target.value)} />
            <label style={styles.label}>Trạng thái:</label>
            <select style={styles.input} value={active ? "1" : "0"} onChange={e => setActive(e.target.value === "1")}> 
              <option value="1">Hoạt động</option>
              <option value="0">Ngừng hoạt động</option>
            </select>
            <button style={{ ...styles.btn, ...styles.addBtn, width: '100%', marginTop: 10 }} onClick={handleSave}>{editClinic ? "Lưu" : "Thêm mới"}</button>
          </div>
        </div>
      )}
      {/* Modal xác nhận xóa */}
      {deleteClinic && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setDeleteClinic(null)}>&times;</button>
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>Xác nhận xóa phòng khám?</div>
            <div style={{marginBottom: 24}}>Bạn có chắc chắn muốn xóa phòng khám <b>{deleteClinic.name}</b>?</div>
            <button style={{...styles.btn, ...styles.delete, minWidth: 90}} onClick={handleDelete}>Xác nhận xóa</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigClinics; 