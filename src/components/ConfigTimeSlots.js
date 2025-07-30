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

function ConfigTimeSlots() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
  const [clinicId, setClinicId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [active, setActive] = useState(true);
  const [deleteSlot, setDeleteSlot] = useState(null);
  const [filterClinic, setFilterClinic] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "time_slots"));
      setTimeSlots(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const clinicSnap = await getDocs(collection(db, "clinics"));
      setClinics(clinicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [showModal, deleteSlot]);

  // Lọc dữ liệu
  const filteredSlots = timeSlots.filter(s => {
    if (filterClinic && s.clinicId !== filterClinic) return false;
    return true;
  });

  const openAdd = () => {
    setEditSlot(null);
    setClinicId("");
    setStartTime("");
    setEndTime("");
    setDuration(30);
    setActive(true);
    setShowModal(true);
  };
  const openEdit = (s) => {
    setEditSlot(s);
    setClinicId(s.clinicId);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setDuration(s.duration);
    setActive(s.active !== false);
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!clinicId || !startTime || !endTime || !duration) return;
    if (editSlot) {
      await updateDoc(doc(db, "time_slots", editSlot.id), { clinicId, startTime, endTime, duration, active });
      setMessage("Cập nhật khung giờ thành công!");
    } else {
      await addDoc(collection(db, "time_slots"), { clinicId, startTime, endTime, duration, active });
      setMessage("Thêm khung giờ thành công!");
    }
    setShowModal(false);
    setTimeout(() => setMessage(""), 2500);
  };
  const handleDelete = async () => {
    if (deleteSlot) {
      await deleteDoc(doc(db, "time_slots", deleteSlot.id));
      setDeleteSlot(null);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>Quản lý khung giờ</div>
      {message && <div style={{color: '#3358e6', fontWeight: 600, marginBottom: 12}}>{message}</div>}
      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <label style={styles.filterLabel}>Phòng khám:
            <select style={styles.filterInput} value={filterClinic} onChange={e => setFilterClinic(e.target.value)}>
              <option value="">Tất cả</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <button style={{ ...styles.btn, ...styles.addBtn }} onClick={openAdd}>+ Thêm khung giờ</button>
      {loading ? <div>Đang tải...</div> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Phòng khám</th>
              <th style={styles.th}>Bắt đầu</th>
              <th style={styles.th}>Kết thúc</th>
              <th style={styles.th}>Thời lượng (phút)</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSlots.length === 0 ? (
              <tr><td colSpan={6}>Không có khung giờ phù hợp</td></tr>
            ) : filteredSlots.map(s => (
              <tr key={s.id}>
                <td style={styles.td}>{clinics.find(c => c.id === s.clinicId)?.name || ""}</td>
                <td style={styles.td}>{s.startTime}</td>
                <td style={styles.td}>{s.endTime}</td>
                <td style={styles.td}>{s.duration}</td>
                <td style={styles.td}>{s.active !== false ? "Hoạt động" : "Ngừng hoạt động"}</td>
                <td style={styles.td}>
                  <button style={{ ...styles.btn, ...styles.edit }} onClick={() => openEdit(s)}>Sửa</button>
                  <button style={{ ...styles.btn, ...styles.delete }} onClick={() => setDeleteSlot(s)}>Xóa</button>
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
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>{editSlot ? "Sửa khung giờ" : "Thêm khung giờ"}</div>
            <label style={styles.label}>Phòng khám:</label>
            <select style={styles.input} value={clinicId} onChange={e => setClinicId(e.target.value)}>
              <option value="">Chọn phòng khám</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label style={styles.label}>Bắt đầu (hh:mm):</label>
            <input style={styles.input} value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="08:00" />
            <label style={styles.label}>Kết thúc (hh:mm):</label>
            <input style={styles.input} value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="08:30" />
            <label style={styles.label}>Thời lượng (phút):</label>
            <input style={styles.input} type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={1} />
            <label style={styles.label}>Trạng thái:</label>
            <select style={styles.input} value={active ? "1" : "0"} onChange={e => setActive(e.target.value === "1")}> 
              <option value="1">Hoạt động</option>
              <option value="0">Ngừng hoạt động</option>
            </select>
            <button style={{ ...styles.btn, ...styles.addBtn, width: '100%', marginTop: 10 }} onClick={handleSave}>{editSlot ? "Lưu" : "Thêm mới"}</button>
          </div>
        </div>
      )}
      {/* Modal xác nhận xóa */}
      {deleteSlot && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button style={styles.closeBtn} onClick={() => setDeleteSlot(null)}>&times;</button>
            <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>Xác nhận xóa khung giờ?</div>
            <div style={{marginBottom: 24}}>Bạn có chắc chắn muốn xóa khung giờ <b>{clinics.find(c => c.id === deleteSlot.clinicId)?.name || ""} {deleteSlot.startTime}-{deleteSlot.endTime}</b>?</div>
            <button style={{...styles.btn, ...styles.delete, minWidth: 90}} onClick={handleDelete}>Xác nhận xóa</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigTimeSlots; 