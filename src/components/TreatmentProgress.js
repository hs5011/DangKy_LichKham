import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
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
  progressCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 12,
    padding: '24px',
    color: '#fff',
    marginBottom: '24px',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: '12px',
  },
  progressBar: {
    width: '100%',
    height: '12px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
    borderRadius: 6,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 14,
    opacity: 0.9,
  },
  treatmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '24px',
  },
  treatmentCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px',
    border: '2px solid #e0e0e0',
    transition: 'all 0.3s ease',
  },
  treatmentCardActive: {
    borderColor: '#3358e6',
    boxShadow: '0 4px 12px rgba(51,88,230,0.15)',
  },
  treatmentCardCompleted: {
    borderColor: '#28a745',
    background: '#f8fff9',
  },
  treatmentCardCancelled: {
    borderColor: '#dc3545',
    background: '#fff8f8',
  },
  treatmentDate: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: '8px',
    color: '#333',
  },
  treatmentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: '8px',
  },
  treatmentClinic: {
    fontSize: 14,
    color: '#666',
    marginBottom: '12px',
  },
  treatmentStatus: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  statusPending: {
    background: '#fff3cd',
    color: '#856404',
  },
  statusApproved: {
    background: '#d1ecf1',
    color: '#0c5460',
  },
  statusCompleted: {
    background: '#d4edda',
    color: '#155724',
  },
  statusCancelled: {
    background: '#f8d7da',
    color: '#721c24',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
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
  message: {
    padding: '12px',
    borderRadius: 6,
    marginTop: '12px',
    fontWeight: 600,
  },
  error: {
    background: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
};

function TreatmentProgress() {
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { getStatusLabel } = useStatus();

  useEffect(() => {
    const fetchTreatmentPlans = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Lấy danh sách treatment plans của user
        const q = query(
          collection(db, 'treatment_plans'),
          where('patientId', '==', user.email),
          orderBy('startDate', 'desc')
        );
        const snap = await getDocs(q);
        const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTreatmentPlans(plans);

        if (plans.length > 0) {
          setSelectedPlan(plans[0]);
        }
      } catch (error) {
        console.error('Error fetching treatment plans:', error);
        setMessage({ type: 'error', text: 'Lỗi khi tải dữ liệu: ' + error.message });
      }
    };

    fetchTreatmentPlans();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedPlan) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, 'appointments'),
          where('treatmentPlanId', '==', selectedPlan.id),
          orderBy('date', 'asc')
        );
        const snap = await getDocs(q);
        const appointmentList = [];

        for (const docA of snap.docs) {
          const appointment = { id: docA.id, ...docA.data() };
          
          // Lấy thông tin phòng khám
          const clinicDoc = await getDoc(doc(db, 'clinics', appointment.clinicId));
          const clinicData = clinicDoc.exists() ? clinicDoc.data() : {};
          
          // Lấy thông tin khung giờ
          const slotDoc = await getDoc(doc(db, 'time_slots', appointment.timeSlotId));
          const slotData = slotDoc.exists() ? slotDoc.data() : {};

          appointmentList.push({
            ...appointment,
            clinic: clinicData,
            slot: slotData,
          });
        }

        setAppointments(appointmentList);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setMessage({ type: 'error', text: 'Lỗi khi tải dữ liệu: ' + error.message });
      }
      setLoading(false);
    };

    fetchAppointments();
  }, [selectedPlan]);

  const calculateProgress = () => {
    if (!appointments.length) return 0;
    const completed = appointments.filter(a => a.completed).length;
    return Math.round((completed / appointments.length) * 100);
  };

  const getCardStyle = (appointment) => {
    if (appointment.completed) return { ...styles.treatmentCard, ...styles.treatmentCardCompleted };
    if (appointment.status === 'cancelled') return { ...styles.treatmentCard, ...styles.treatmentCardCancelled };
    if (appointment.status === 'approved') return { ...styles.treatmentCard, ...styles.treatmentCardActive };
    return styles.treatmentCard;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { ...styles.treatmentStatus, ...styles.statusPending };
      case 'approved': return { ...styles.treatmentStatus, ...styles.statusApproved };
      case 'completed': return { ...styles.treatmentStatus, ...styles.statusCompleted };
      case 'cancelled': return { ...styles.treatmentStatus, ...styles.statusCancelled };
      default: return { ...styles.treatmentStatus, ...styles.statusPending };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div>Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Tiến độ phác đồ điều trị</h3>

        {treatmentPlans.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <h4>Chưa có phác đồ điều trị nào</h4>
            <p>Bạn cần đặt lịch khám để có phác đồ điều trị.</p>
          </div>
        ) : (
          <>
            {/* Bộ lọc phác đồ */}
            <div style={styles.filterBox}>
              <div style={styles.filterRow}>
                <div style={styles.filterGroup}>
                  <label style={styles.label}>Chọn phác đồ:</label>
                  <select
                    style={styles.select}
                    value={selectedPlan?.id || ''}
                    onChange={(e) => {
                      const plan = treatmentPlans.find(p => p.id === e.target.value);
                      setSelectedPlan(plan);
                    }}
                  >
                    {treatmentPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        Phác đồ {plan.days} ngày - Bắt đầu {formatDate(plan.startDate)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Thống kê tiến độ */}
            {selectedPlan && (
              <div style={styles.progressCard}>
                <div style={styles.progressTitle}>
                  Tiến độ phác đồ {selectedPlan.days} ngày
                </div>
                <div style={styles.progressBar}>
                  <div 
                    style={{...styles.progressFill, width: `${calculateProgress()}%`}}
                  />
                </div>
                <div style={styles.progressText}>
                  {appointments.filter(a => a.completed).length} / {appointments.length} buổi đã hoàn thành
                </div>
              </div>
            )}

            {/* Danh sách các buổi khám */}
            {appointments.length > 0 ? (
              <div style={styles.treatmentGrid}>
                {appointments.map((appointment, index) => (
                  <div key={appointment.id} style={getCardStyle(appointment)}>
                    <div style={styles.treatmentDate}>
                      Buổi {index + 1} - {formatDate(appointment.date)}
                    </div>
                    <div style={styles.treatmentTime}>
                      {formatTime(appointment.slot.startTime)} - {formatTime(appointment.slot.endTime)}
                    </div>
                    <div style={styles.treatmentClinic}>
                      {appointment.clinic.name || 'Phòng khám'}
                    </div>
                    <div style={getStatusStyle(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </div>
                    {appointment.completed && (
                      <div style={{...styles.treatmentStatus, ...styles.statusCompleted, marginTop: '8px'}}>
                        ✅ Đã hoàn thành
                      </div>
                    )}
                    {appointment.called && !appointment.completed && (
                      <div style={{...styles.treatmentStatus, ...styles.statusApproved, marginTop: '8px'}}>
                        📞 Đã gọi
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📅</div>
                <h4>Chưa có lịch khám nào</h4>
                <p>Vui lòng đặt lịch khám để xem tiến độ.</p>
              </div>
            )}
          </>
        )}

        {message && (
          <div style={{...styles.message, ...styles.error}}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default TreatmentProgress; 