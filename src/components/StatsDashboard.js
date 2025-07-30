import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useStatus } from "../context/StatusContext";

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(79,140,255,0.10)',
    padding: '32px 36px',
    minWidth: 400,
    maxWidth: 900,
    margin: '0 auto',
  },
  title: {
    fontWeight: 700,
    fontSize: 22,
    color: '#3358e6',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsRow: {
    display: 'flex',
    gap: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statBox: {
    background: '#f7fafd',
    borderRadius: 10,
    padding: '18px 28px',
    minWidth: 180,
    textAlign: 'center',
    boxShadow: '0 1px 4px rgba(79,140,255,0.06)',
  },
  statLabel: {
    color: '#3358e6',
    fontWeight: 600,
    fontSize: 15,
    marginBottom: 6,
  },
  statValue: {
    color: '#22336b',
    fontWeight: 700,
    fontSize: 24,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 18,
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
};

function StatsDashboard() {
  const { statuses } = useStatus();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [clinicStats, setClinicStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const apptSnap = await getDocs(collection(db, "appointments"));
      const userSnap = await getDocs(collection(db, "users"));
      const clinicSnap = await getDocs(collection(db, "clinics"));
      const appts = apptSnap.docs.map(doc => doc.data());
      const clinics = clinicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Tổng số lịch
      const total = appts.length;
      const pending = appts.filter(a => a.status === "pending").length;
      const approved = appts.filter(a => a.status === "approved").length;
      const completed = appts.filter(a => a.completed).length;
      const cancelled = appts.filter(a => a.status === "cancelled").length;
      const rescheduled = appts.filter(a => a.status === "rescheduled").length;
      // Số lượng bệnh nhân
      const patients = userSnap.docs.filter(u => u.data().role === "patient").length;
      // Số lần dời lịch
      const totalReschedule = appts.reduce((sum, a) => sum + (a.rescheduleCount || 0), 0);
      // Thống kê theo phòng khám
      const byClinic = clinics.map(c => ({
        name: c.name,
        total: appts.filter(a => a.clinicId === c.id).length,
        completed: appts.filter(a => a.clinicId === c.id && a.completed).length,
      }));
      setStats({ total, pending, approved, completed, cancelled, rescheduled, patients, totalReschedule });
      setClinicStats(byClinic);
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.title}>Thống kê tổng quan</div>
      {loading ? <div>Đang tải...</div> : (
        <>
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Tổng số lịch khám</div>
              <div style={styles.statValue}>{stats.total}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Chờ duyệt</div>
              <div style={styles.statValue}>{stats.pending}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Đã duyệt</div>
              <div style={styles.statValue}>{stats.approved}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Đã hoàn thành</div>
              <div style={styles.statValue}>{stats.completed}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Đã hủy</div>
              <div style={styles.statValue}>{stats.cancelled}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Đã dời lịch</div>
              <div style={styles.statValue}>{stats.rescheduled}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Số bệnh nhân</div>
              <div style={styles.statValue}>{stats.patients}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Tổng số lần dời</div>
              <div style={styles.statValue}>{stats.totalReschedule}</div>
            </div>
          </div>
          <div style={{fontWeight: 600, color: '#3358e6', margin: '18px 0 8px'}}>Thống kê theo phòng khám</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Phòng khám</th>
                <th style={styles.th}>Tổng số lịch</th>
                <th style={styles.th}>Đã hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {clinicStats.length === 0 ? (
                <tr><td colSpan={3}>Không có dữ liệu</td></tr>
              ) : clinicStats.map((c, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{c.name}</td>
                  <td style={styles.td}>{c.total}</td>
                  <td style={styles.td}>{c.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default StatsDashboard; 