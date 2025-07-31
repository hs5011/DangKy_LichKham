import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, getDocs, addDoc, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { useStatus } from "../context/StatusContext";
import dayjs from 'dayjs';

function formatDateDMY(dateStr) {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  try {
    const d = new Date(dateStr.seconds ? dateStr.seconds * 1000 : dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

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
    minHeight: 60,
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

function RescheduleRequest() {
  const { getStatusLabel } = useStatus();
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterApptClinic, setFilterApptClinic] = useState("");
  const [filterApptStatus, setFilterApptStatus] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      // Lấy lịch khám sắp tới
      const today = new Date().toISOString().slice(0, 10);
      const q = query(collection(db, "appointments"), where("patientId", "==", user.email), where("date", ">=", today));
      const snap = await getDocs(q);
      const appts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(a => a.status !== 'completed' && a.status !== 'cancelled');
      setAppointments(appts);
      // Lấy danh sách phòng khám
      const clinicSnap = await getDocs(collection(db, "clinics"));
      setClinics(clinicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Lấy danh sách khung giờ
      const slotSnap = await getDocs(collection(db, "time_slots"));
      setTimeSlots(slotSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Lấy lịch sử yêu cầu dời ngày
      const rq = query(collection(db, "reschedule_requests"), where("patientId", "==", user.email), orderBy("createdAt", "desc"));
      const rsnap = await getDocs(rq);
      setRequests(rsnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [message]);

  const openModal = (appt) => {
    setSelectedAppt(appt);
    setNewDate("");
    setReason("");
    setMessage("");
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!newDate || !reason) {
      setMessage("Vui lòng chọn ngày mới và nhập lý do!");
      return;
    }
    const user = auth.currentUser;
    // Kiểm tra ngày mới không trùng ngày nào trong phác đồ
    try {
      // Lấy treatmentPlanId của lịch hiện tại
      const planId = selectedAppt.treatmentPlanId;
      if (planId) {
        // Đếm số lần dời lịch (pending hoặc approved)
        const rq = query(collection(db, "reschedule_requests"), where("patientId", "==", user.email), where("appointmentId", "!=", null));
        const rsnap = await getDocs(rq);
        const count = rsnap.docs.filter(doc => {
          const d = doc.data();
          return d.treatmentPlanId === planId && (d.status === 'pending' || d.status === 'approved');
        }).length;
        if (count >= 2) {
          setMessage("Bạn chỉ được dời tối đa 2 lần trên 1 phác đồ điều trị!");
          return;
        }
        // Kiểm tra ngày trùng phác đồ
        const q = query(collection(db, "appointments"), where("treatmentPlanId", "==", planId));
        const snap = await getDocs(q);
        const allDates = snap.docs.map(doc => doc.data().date);
        if (allDates.includes(newDate)) {
          setMessage("Ngày bạn chọn đã nằm trong phác đồ điều trị, vui lòng chọn ngày khác!");
          return;
        }
      }
      await addDoc(collection(db, "reschedule_requests"), {
        patientId: user.email,
        appointmentId: selectedAppt.id,
        oldDate: selectedAppt.date,
        oldTimeSlotId: selectedAppt.timeSlotId,
        newDate,
        reason,
        status: "pending",
        createdAt: serverTimestamp(),
        treatmentPlanId: planId || null,
      });
      setMessage("Gửi yêu cầu dời ngày thành công!");
      setShowModal(false);
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
  };

  // Hàm lấy tên phòng khám
  const getClinicName = (id) => clinics.find(c => c.id === id)?.name || id;

  // Hàm lấy tên khung giờ từ id
  const getTimeSlotName = (id) => {
    if (!id) return '';
    const slot = timeSlots.find(s => s.id === id);
    if (!slot) return id;
    if (slot.startTime && slot.endTime) return `${slot.startTime}-${slot.endTime}`;
    return slot.name || id;
  };

  // Hàm hiển thị trạng thái tiếng Việt
  const getStatusLabelVN = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Đã từ chối';
      default: return status;
    }
  };

  // Lọc requests theo tiêu chí
  const filteredRequests = requests.filter(r => {
    // Lọc theo ngày yêu cầu
    if (filterDate) {
      let reqDate = r.createdAt;
      if (reqDate && typeof reqDate === 'object' && reqDate.seconds) reqDate = dayjs(new Date(reqDate.seconds * 1000)).format('YYYY-MM-DD');
      else if (typeof reqDate === 'string') reqDate = dayjs(new Date(reqDate)).format('YYYY-MM-DD');
      else reqDate = '';
      if (reqDate !== filterDate) return false;
    }
    // Lọc theo phòng khám
    if (filterClinic && r.oldTimeSlotId) {
      // Tìm appointment cũ tương ứng để lấy clinicId
      const appt = appointments.find(a => a.timeSlotId === r.oldTimeSlotId && a.date === r.oldDate);
      if (!appt || appt.clinicId !== filterClinic) return false;
    }
    // Lọc theo trạng thái
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  // Lọc lịch khám sắp tới theo tiêu chí
  const filteredAppointments = appointments.filter(a => {
    if (filterApptClinic && a.clinicId !== filterApptClinic) return false;
    if (filterApptStatus && a.status !== filterApptStatus) return false;
    return true;
  });

  return (
    <div style={styles.card}>
      <div style={styles.title}>Xin dời ngày khám bệnh</div>
      <h4>Lịch khám sắp tới</h4>
      {/* Bộ lọc lịch khám sắp tới */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Phòng khám:<br/>
            <select value={filterApptClinic} onChange={e => setFilterApptClinic(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}>
              <option value="">Tất cả</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Trạng thái:<br/>
            <select value={filterApptStatus} onChange={e => setFilterApptStatus(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}>
              <option value="">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </label>
        </div>
      </div>
      {loading ? <div>Đang tải...</div> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ngày khám</th>
              <th style={styles.th}>Phòng khám</th>
              <th style={styles.th}>Khung giờ</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr><td colSpan={6}>Không có lịch khám sắp tới</td></tr>
            ) : filteredAppointments.map(a => {
              // Chỉ hiện nút xin dời nếu ngày khám > ngày hiện tại
              const today = dayjs().format('YYYY-MM-DD');
              const showReschedule = a.date > today;
              return (
                <tr key={a.id}>
                  <td style={styles.td}>{formatDateDMY(a.date)}</td>
                  <td style={styles.td}>{getClinicName(a.clinicId)}</td>
                  <td style={styles.td}>{getTimeSlotName(a.timeSlotId)}</td>
                  <td style={styles.td}>{getStatusLabelVN(a.status)}</td>
                  <td style={styles.td}>
                    {showReschedule && <button style={styles.btn} onClick={() => openModal(a)}>Xin dời</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {/* Modal xin dời */}
      {showModal && selectedAppt && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closeModal}>&times;</button>
            <h3>Xin dời ngày khám</h3>
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Ngày khám cũ: {formatDateDMY(selectedAppt.date)}</label>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 500, minWidth: 110 }}>Ngày khám mới:</span>
                <input type="date" style={{ ...styles.input, marginBottom: 0, width: 'auto', flex: 1 }} value={newDate} onChange={e => setNewDate(e.target.value)} min={selectedAppt.date} required />
              </div>
              <label style={styles.label}>Lý do xin dời:</label>
              <textarea style={styles.textarea} value={reason} onChange={e => setReason(e.target.value)} required />
              {message && <div style={message.startsWith('Lỗi') || message.includes('vui lòng chọn ngày khác') ? styles.error : styles.success}>{message}</div>}
              <button type="submit" style={styles.btn}>Gửi yêu cầu</button>
            </form>
          </div>
        </div>
      )}
      <h4>Lịch sử yêu cầu dời ngày</h4>
      {/* Bộ lọc lịch sử */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Ngày yêu cầu:<br/>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
          </label>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Phòng khám:<br/>
            <select value={filterClinic} onChange={e => setFilterClinic(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}>
              <option value="">Tất cả</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Trạng thái:<br/>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}>
              <option value="">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </label>
        </div>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Ngày cũ</th>
            <th style={styles.th}>Khung giờ cũ</th>
            <th style={styles.th}>Ngày mới</th>
            <th style={styles.th}>Khung giờ mới</th>
            <th style={styles.th}>Lý do</th>
            <th style={styles.th}>Trạng thái</th>
            <th style={styles.th}>Phản hồi QTV</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.length === 0 ? (
            <tr><td colSpan={7}>Chưa có yêu cầu nào</td></tr>
          ) : filteredRequests.map(r => (
            <tr key={r.id}>
              <td style={styles.td}>{formatDateDMY(r.oldDate)}</td>
              <td style={styles.td}>{getTimeSlotName(r.oldTimeSlotId)}</td>
              <td style={styles.td}>{formatDateDMY(r.newDate)}</td>
              <td style={styles.td}>{getTimeSlotName(r.newTimeSlotId)}</td>
              <td style={styles.td}>{r.reason}</td>
              <td style={styles.td}>{getStatusLabelVN(r.status)}</td>
              <td style={styles.td}>{r.rejectReason || r.adminNote || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RescheduleRequest; 