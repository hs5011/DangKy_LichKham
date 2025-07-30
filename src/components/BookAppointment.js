import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { useStatus } from "../context/StatusContext";

function formatDateDMY(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '32px 36px',
    minWidth: 370,
    maxWidth: 95,
    textAlign: 'center',
    margin: '40px auto',
    position: 'relative',
  },
  logoutBtn: {
    position: 'absolute',
    top: 18,
    right: 24,
    background: 'none',
    border: 'none',
    color: '#e53935',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  formRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 150,
    marginBottom: 0,
  },
  label: {
    fontWeight: 500,
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    outline: 'none',
    marginBottom: 0,
    background: '#f7fafd',
    transition: 'border 0.2s',
  },
  select: {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    background: '#f7fafd',
    outline: 'none',
    marginBottom: 0,
  },
  button: {
    marginTop: 18,
    padding: '10px 28px',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(79,140,255,0.12)',
    transition: 'background 0.2s',
  },
  error: {
    color: '#e53935',
    marginTop: 10,
    fontWeight: 500,
  },
  title: {
    fontWeight: 700,
    fontSize: 22,
    marginBottom: 24,
    color: '#22336b',
    letterSpacing: 0.5,
  },
};

function BookAppointment() {
  const { statuses } = useStatus();
  const [clinics, setClinics] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState("");
  // Đảm bảo state date là string, không phải dayjs object
  const [date, setDate] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Lấy danh sách phòng khám
  useEffect(() => {
    const fetchClinics = async () => {
      const q = query(collection(db, "clinics"));
      const snap = await getDocs(q);
      setClinics(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchClinics();
  }, []);

  // Lấy danh sách phác đồ điều trị
  useEffect(() => {
    const fetchProtocols = async () => {
      const q = query(collection(db, "treatment_protocols"));
      const snap = await getDocs(q);
      setProtocols(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchProtocols();
  }, []);

  // Lấy danh sách khung giờ theo phòng khám
  useEffect(() => {
    if (!selectedClinic) {
      setTimeSlots([]);
      setSelectedTimeSlot("");
      return;
    }
    const fetchTimeSlots = async () => {
      const q = query(collection(db, "time_slots"), where("clinicId", "==", selectedClinic));
      const snap = await getDocs(q);
      setTimeSlots(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTimeSlots();
  }, [selectedClinic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!date || !selectedClinic || !selectedTimeSlot || !selectedProtocol || !symptoms) {
      setMessage("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    setLoading(true);
    try {
      // Lấy thông tin phác đồ
      const protocol = protocols.find(p => p.id === selectedProtocol);
      const user = auth.currentUser;
      if (!user) throw new Error("Chưa đăng nhập!");
      // Tìm status pending từ danh mục
      const pendingStatus = statuses.find(s => s.code === 'pending');
      if (!pendingStatus) throw new Error("Không tìm thấy trạng thái pending!");
      
      // Tạo treatment_plan
      const planRef = await addDoc(collection(db, "treatment_plans"), {
        patientId: user.email,
        startDate: date,
        days: protocol.days,
        status: pendingStatus.code,
        createdAt: serverTimestamp(),
        protocolId: selectedProtocol, // Lưu id phác đồ
      });
      // Tạo các appointments liên tiếp theo số ngày của phác đồ
      const appointments = [];
      let currentDate = new Date(date);
      for (let i = 0; i < protocol.days; i++) {
        const apptDate = new Date(currentDate);
        const apptRef = await addDoc(collection(db, "appointments"), {
          patientId: user.email,
          clinicId: selectedClinic,
          timeSlotId: selectedTimeSlot,
          treatmentPlanId: planRef.id,
          date: apptDate.toISOString().slice(0, 10),
          status: pendingStatus.code,
          symptoms,
          note,
          rescheduleCount: 0,
          createdAt: serverTimestamp(),
        });
        appointments.push(apptRef.id);
        // Ngày tiếp theo
        currentDate.setDate(currentDate.getDate() + 1);
      }
      // Cập nhật lại treatment_plan với danh sách appointments
      await updateDoc(planRef, { appointments });
      setMessage("Đặt lịch thành công! Vui lòng chờ quản trị viên duyệt.");
      // Reset form
      setDate(null);
      setSelectedClinic("");
      setSelectedTimeSlot("");
      setSelectedProtocol("");
      setSymptoms("");
      setNote("");
    } catch (err) {
      setMessage("Lỗi: " + err.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.reload();
  };

  return (
    <div style={styles.card}>
      <button style={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
      <div style={styles.title}>Đặt lịch khám bệnh</div>
      <form onSubmit={handleSubmit}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ngày khám:</label>
            <input
              type="date"
              style={styles.input}
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phòng khám:</label>
            <select
              style={styles.select}
              value={selectedClinic}
              onChange={e => setSelectedClinic(e.target.value)}
              required
            >
              <option value="">Chọn phòng khám</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Khung giờ:</label>
            <select
              style={styles.select}
              value={selectedTimeSlot}
              onChange={e => setSelectedTimeSlot(e.target.value)}
              required
              disabled={!selectedClinic}
            >
              <option value="">Chọn khung giờ</option>
              {timeSlots.map(ts => (
                <option key={ts.id} value={ts.id}>{ts.startTime} - {ts.endTime}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phác đồ điều trị:</label>
            <select
              style={styles.select}
              value={selectedProtocol}
              onChange={e => setSelectedProtocol(e.target.value)}
              required
            >
              <option value="">Chọn phác đồ</option>
              {protocols.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.days} ngày)</option>
              ))}
            </select>
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Triệu chứng:</label>
            <input
              type="text"
              style={styles.input}
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ghi chú:</label>
            <input
              type="text"
              style={styles.input}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" style={styles.button} disabled={loading}>{loading ? "Đang đặt lịch..." : "Đặt lịch"}</button>
      </form>
      {message && <div style={styles.error}>{message}</div>}
    </div>
  );
}

export default BookAppointment; 