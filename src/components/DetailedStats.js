import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useStatus } from '../context/StatusContext';

const styles = {
  container: {
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#22336b',
    marginBottom: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 12,
    padding: '20px',
    color: '#fff',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9,
  },
  chartContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginTop: '24px',
  },
  chartCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px',
    border: '1px solid #e0e0e0',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: '16px',
    color: '#333',
  },
  barChart: {
    display: 'flex',
    alignItems: 'end',
    height: '200px',
    gap: '8px',
    padding: '20px 0',
  },
  bar: {
    flex: 1,
    background: 'linear-gradient(to top, #3358e6, #4f8cff)',
    borderRadius: '4px 4px 0 0',
    position: 'relative',
    minHeight: '20px',
  },
  barLabel: {
    position: 'absolute',
    bottom: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '12px',
    color: '#666',
    whiteSpace: 'nowrap',
  },
  barValue: {
    position: 'absolute',
    top: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '12px',
    fontWeight: 600,
    color: '#3358e6',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '16px',
  },
  th: {
    background: '#f8f9fa',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #dee2e6',
    fontWeight: 600,
    color: '#333',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
  },
  filterBox: {
    background: '#f8f9fa',
    borderRadius: 8,
    padding: '16px',
    marginBottom: '20px',
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontWeight: 500,
    marginBottom: 8,
    textAlign: 'left',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};

function DetailedStats() {
  const { statuses } = useStatus();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalPatients: 0,
    totalReschedules: 0,
    clinicStats: [],
    monthlyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Lấy tất cả appointments
        const appointmentsSnap = await getDocs(collection(db, 'appointments'));
        const appointments = appointmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Lấy tất cả users (patients)
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const patients = users.filter(user => user.role === 'patient' || !user.role);

        // Lấy tất cả reschedule requests
        const rescheduleSnap = await getDocs(collection(db, 'reschedule_requests'));
        const reschedules = rescheduleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Lấy danh sách phòng khám
        const clinicsSnap = await getDocs(collection(db, 'clinics'));
        const clinics = clinicsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Tính toán thống kê tổng quan
        const totalAppointments = appointments.length;
        const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
        const approvedAppointments = appointments.filter(a => a.status === 'approved').length;
        const completedAppointments = appointments.filter(a => a.completed).length;
        const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
        const totalPatients = patients.length;
        const totalReschedules = reschedules.length;

        // Thống kê theo phòng khám
        const clinicStats = clinics.map(clinic => {
          const clinicAppointments = appointments.filter(a => a.clinicId === clinic.id);
          return {
            name: clinic.name,
            total: clinicAppointments.length,
            pending: clinicAppointments.filter(a => a.status === 'pending').length,
            approved: clinicAppointments.filter(a => a.status === 'approved').length,
            completed: clinicAppointments.filter(a => a.completed).length,
          };
        });

        // Thống kê theo tháng (6 tháng gần nhất)
        const monthlyStats = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStr = date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
          const monthAppointments = appointments.filter(a => {
            const appointmentDate = new Date(a.date);
            return appointmentDate.getMonth() === date.getMonth() && 
                   appointmentDate.getFullYear() === date.getFullYear();
          });
          
          monthlyStats.push({
            month: monthStr,
            total: monthAppointments.length,
            completed: monthAppointments.filter(a => a.completed).length,
          });
        }

        setStats({
          totalAppointments,
          pendingAppointments,
          approvedAppointments,
          completedAppointments,
          cancelledAppointments,
          totalPatients,
          totalReschedules,
          clinicStats,
          monthlyStats,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    };

    fetchStats();
  }, [selectedPeriod]);

  const getMaxValue = (data, key) => {
    return Math.max(...data.map(item => item[key]), 1);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Đang tải thống kê...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Thống kê chi tiết</h3>

        {/* Bộ lọc */}
        <div style={styles.filterBox}>
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Thời gian:</label>
              <select
                style={styles.select}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
                <option value="year">Năm nay</option>
              </select>
            </div>
          </div>
        </div>

        {/* Thống kê tổng quan */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalAppointments}</div>
            <div style={styles.statLabel}>Tổng lịch khám</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.pendingAppointments}</div>
            <div style={styles.statLabel}>Chờ duyệt</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.approvedAppointments}</div>
            <div style={styles.statLabel}>Đã duyệt</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.completedAppointments}</div>
            <div style={styles.statLabel}>Đã hoàn thành</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalPatients}</div>
            <div style={styles.statLabel}>Tổng bệnh nhân</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalReschedules}</div>
            <div style={styles.statLabel}>Yêu cầu dời lịch</div>
          </div>
        </div>

        {/* Biểu đồ */}
        <div style={styles.chartContainer}>
          {/* Biểu đồ theo phòng khám */}
          <div style={styles.chartCard}>
            <h4 style={styles.chartTitle}>Thống kê theo phòng khám</h4>
            <div style={styles.barChart}>
              {stats.clinicStats.map((clinic, index) => {
                const maxTotal = getMaxValue(stats.clinicStats, 'total');
                const height = (clinic.total / maxTotal) * 160;
                return (
                  <div key={clinic.name} style={{...styles.bar, height: `${height}px`}}>
                    <div style={styles.barValue}>{clinic.total}</div>
                    <div style={styles.barLabel}>{clinic.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Biểu đồ theo tháng */}
          <div style={styles.chartCard}>
            <h4 style={styles.chartTitle}>Thống kê theo tháng</h4>
            <div style={styles.barChart}>
              {stats.monthlyStats.map((month, index) => {
                const maxTotal = getMaxValue(stats.monthlyStats, 'total');
                const height = (month.total / maxTotal) * 160;
                return (
                  <div key={month.month} style={{...styles.bar, height: `${height}px`}}>
                    <div style={styles.barValue}>{month.total}</div>
                    <div style={styles.barLabel}>{month.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bảng chi tiết phòng khám */}
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Chi tiết theo phòng khám</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Phòng khám</th>
                <th style={styles.th}>Tổng lịch</th>
                <th style={styles.th}>Chờ duyệt</th>
                <th style={styles.th}>Đã duyệt</th>
                <th style={styles.th}>Đã hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {stats.clinicStats.map(clinic => (
                <tr key={clinic.name}>
                  <td style={styles.td}>{clinic.name}</td>
                  <td style={styles.td}>{clinic.total}</td>
                  <td style={styles.td}>{clinic.pending}</td>
                  <td style={styles.td}>{clinic.approved}</td>
                  <td style={styles.td}>{clinic.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DetailedStats; 