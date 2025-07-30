import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, getDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  dateSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  dateInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  filterBox: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  filterRow: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  filterLabel: {
    fontWeight: '600',
    color: '#2c3e50',
    minWidth: '100px'
  },
  filterInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '150px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  th: {
    backgroundColor: '#34495e',
    color: 'white',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'middle'
  },
  btn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginRight: '8px'
  },
  callBtn: {
    backgroundColor: '#27ae60',
    color: 'white'
  },
  completeBtn: {
    backgroundColor: '#3498db',
    color: 'white'
  },
  waitingBtn: {
    backgroundColor: '#f39c12',
    color: 'white'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
    minWidth: '80px'
  },
  statusWaiting: {
    backgroundColor: '#fff3cd',
    color: '#856404'
  },
  statusInProgress: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460'
  },
  statusCompleted: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  modalSection: {
    marginBottom: '20px'
  },
  modalRow: {
    display: 'flex',
    marginBottom: '8px'
  },
  modalLabel: {
    fontWeight: '600',
    minWidth: '120px',
    color: '#2c3e50'
  },
  modalValue: {
    color: '#666'
  },
  tabContainer: {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '2px solid #e9ecef'
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: '#f8f9fa',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s ease'
  },
  activeTab: {
    backgroundColor: 'white',
    borderBottom: '2px solid #3498db',
    color: '#3498db'
  },
  tabContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  calledPatientCard: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #e9ecef'
  },
  historyItem: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
};

function DoctorAppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClinic, setFilterClinic] = useState('');
  const [clinics, setClinics] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [activeTab, setActiveTab] = useState('appointments'); // Thêm state cho tabs
  const [calledPatients, setCalledPatients] = useState([]); // Thêm state cho số đã gọi
  const [callHistory, setCallHistory] = useState([]); // Thêm state cho lịch sử gọi

  // Lấy danh sách phòng khám
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const clinicsSnapshot = await getDocs(collection(db, 'clinics'));
        const clinicsData = clinicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClinics(clinicsData);
      } catch (error) {
        console.error('Error fetching clinics:', error);
      }
    };
    fetchClinics();
  }, []);

  // Lấy danh sách lịch khám
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Lấy tất cả appointments đã được duyệt (approved, waiting, in_progress, completed)
        const q = query(
          collection(db, 'appointments'),
          where('status', 'in', ['approved', 'waiting', 'in_progress', 'completed']),
          orderBy('date', 'asc')
        );
        
        const snapshot = await getDocs(q);
        const appointmentsData = [];
        
        console.log('Total appointments found:', snapshot.docs.length); // Debug log
        
        for (const doc of snapshot.docs) {
          const appointment = { id: doc.id, ...doc.data() };
          console.log('Processing appointment:', appointment); // Debug log
          
          // Lấy thông tin bệnh nhân
          if (appointment.patientId) {
            const userSnapshot = await getDocs(query(
              collection(db, 'users'),
              where('email', '==', appointment.patientId)
            ));
            if (!userSnapshot.empty) {
              appointment.user = userSnapshot.docs[0].data();
              console.log('Found user data:', appointment.user); // Debug log
            }
          }
          
          // Lấy thông tin phòng khám
          if (appointment.clinicId) {
            const clinicDoc = await getDoc(doc(db, 'clinics', appointment.clinicId));
            if (clinicDoc.exists()) {
              appointment.clinic = clinicDoc.data();
              console.log('Found clinic data:', appointment.clinic); // Debug log
            }
          }
          
          // Lấy thông tin khung giờ
          if (appointment.timeSlotId) {
            const slotDoc = await getDoc(doc(db, 'time_slots', appointment.timeSlotId));
            if (slotDoc.exists()) {
              appointment.slot = slotDoc.data();
              console.log('Found slot data:', appointment.slot); // Debug log
            }
          }
          
          appointmentsData.push(appointment);
        }
        
        console.log('Fetched appointments:', appointmentsData); // Debug log
        console.log('Total appointments loaded:', appointmentsData.length); // Debug log
        console.log('Appointments with dates:', appointmentsData.map(a => ({ id: a.id, date: a.date, status: a.status }))); // Debug log
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);

  // Lọc appointments theo ngày và điều kiện khác
  const filteredAppointments = appointments.filter(appointment => {
    console.log('Checking appointment:', appointment); // Debug log
    
    // Lọc theo ngày - chuyển đổi format để so sánh
    let matchesDate = true;
    if (selectedDate) {
      const appointmentDate = appointment.date;
      console.log('Appointment date:', appointmentDate, 'Selected date:', selectedDate); // Debug log
      
      // Chuyển đổi format ngày để so sánh
      const appointmentDateFormatted = appointmentDate ? new Date(appointmentDate).toISOString().split('T')[0] : '';
      matchesDate = appointmentDateFormatted === selectedDate;
      console.log('Date match:', matchesDate); // Debug log
    }
    
    const matchesStatus = !filterStatus || appointment.status === filterStatus;
    const matchesClinic = !filterClinic || appointment.clinicId === filterClinic;
    
    const result = matchesDate && matchesStatus && matchesClinic;
    console.log('Final result for appointment:', appointment.id, result); // Debug log
    
    return result;
  });

  console.log('Filtered appointments:', filteredAppointments); // Debug log
  console.log('Selected date:', selectedDate); // Debug log
  console.log('Filter status:', filterStatus); // Debug log
  console.log('Filter clinic:', filterClinic); // Debug log

  // Cập nhật trạng thái lịch khám
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setActionMsg(`Đã cập nhật trạng thái lịch khám thành ${getStatusLabel(newStatus)}`);
      
      // Thêm vào lịch sử
      const appointment = appointments.find(ap => ap.id === appointmentId);
      if (appointment) {
        const historyItem = {
          ...appointment,
          updatedAt: new Date(),
          updatedTime: new Date().toLocaleTimeString('vi-VN'),
          action: `Cập nhật trạng thái: ${getStatusLabel(newStatus)}`
        };
        setCallHistory(prev => [historyItem, ...prev]);
      }
      
      // Refresh danh sách
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setActionMsg('Lỗi khi cập nhật trạng thái: ' + error.message);
    }
  };

  // Gọi số đến lượt khám
  const callNextPatient = (appointment) => {
    setDetailData(appointment);
    setShowDetail(true);
    
    // Thêm vào danh sách đã gọi
    const calledPatient = {
      ...appointment,
      calledAt: new Date(),
      calledTime: new Date().toLocaleTimeString('vi-VN')
    };
    setCalledPatients(prev => [calledPatient, ...prev]);
    
    // Thêm vào lịch sử gọi
    const historyItem = {
      ...appointment,
      calledAt: new Date(),
      calledTime: new Date().toLocaleTimeString('vi-VN'),
      action: 'Gọi số'
    };
    setCallHistory(prev => [historyItem, ...prev]);
  };

  // Hiển thị trạng thái
  const getStatusLabel = (status) => {
    switch (status) {
      case 'waiting': return 'Chờ khám';
      case 'in_progress': return 'Đang khám';
      case 'completed': return 'Đã khám';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  // Hiển thị badge trạng thái
  const getStatusBadge = (status) => {
    const baseStyle = { ...styles.statusBadge };
    switch (status) {
      case 'waiting':
        return { ...baseStyle, ...styles.statusWaiting };
      case 'in_progress':
        return { ...baseStyle, ...styles.statusInProgress };
      case 'completed':
        return { ...baseStyle, ...styles.statusCompleted };
      case 'cancelled':
        return { ...baseStyle, ...styles.statusCancelled };
      default:
        return baseStyle;
    }
  };

  // Định dạng ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  // Định dạng giờ
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Quản lý lịch khám - Bác sĩ</h1>
        <div style={styles.dateSelector}>
          <label>Ngày khám:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'appointments' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('appointments')}
        >
          Lịch khám ({filteredAppointments.length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'called' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('called')}
        >
          Số đã gọi ({calledPatients.length})
        </button>
        <button 
          style={{ ...styles.tab, ...(activeTab === 'history' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('history')}
        >
          Lịch sử gọi ({callHistory.length})
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'appointments' && (
          <>
            <div style={styles.filterBox}>
              <div style={styles.filterRow}>
                <label style={styles.filterLabel}>Trạng thái:</label>
                <select 
                  style={styles.filterInput} 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="waiting">Chờ khám</option>
                  <option value="in_progress">Đang khám</option>
                  <option value="completed">Đã khám</option>
                  <option value="cancelled">Đã hủy</option>
                </select>

                <label style={styles.filterLabel}>Phòng khám:</label>
                <select 
                  style={styles.filterInput} 
                  value={filterClinic} 
                  onChange={(e) => setFilterClinic(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {clinics.map(clinic => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
            ) : (
              <>
                {filteredAppointments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <h3>Không có lịch khám nào</h3>
                    <p>Vui lòng kiểm tra lại:</p>
                    <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                      <li>Ngày khám đã chọn</li>
                      <li>Bộ lọc trạng thái</li>
                      <li>Bộ lọc phòng khám</li>
                      <li>Admin đã duyệt lịch khám chưa</li>
                    </ul>
                                         <div style={{ marginTop: '20px' }}>
                       <button 
                         onClick={() => {
                           setSelectedDate('');
                           setFilterStatus('');
                           setFilterClinic('');
                         }}
                         style={{
                           padding: '10px 20px',
                           backgroundColor: '#27ae60',
                           color: 'white',
                           border: 'none',
                           borderRadius: '4px',
                           cursor: 'pointer',
                           marginRight: '10px'
                         }}
                       >
                         Xóa bộ lọc
                       </button>
                       <button 
                         onClick={() => {
                           console.log('All appointments:', appointments);
                           console.log('All appointments count:', appointments.length);
                           alert(`Tổng số lịch khám: ${appointments.length}`);
                         }}
                         style={{
                           padding: '10px 20px',
                           backgroundColor: '#3498db',
                           color: 'white',
                           border: 'none',
                           borderRadius: '4px',
                           cursor: 'pointer'
                         }}
                       >
                         Xem tất cả ({appointments.length})
                       </button>
                     </div>
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>STT</th>
                        <th style={styles.th}>Họ tên bệnh nhân</th>
                        <th style={styles.th}>SĐT</th>
                        <th style={styles.th}>Ngày khám</th>
                        <th style={styles.th}>Giờ khám</th>
                        <th style={styles.th}>Phòng khám</th>
                        <th style={styles.th}>Trạng thái</th>
                        <th style={styles.th}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((appointment, index) => (
                        <tr key={appointment.id}>
                          <td style={styles.td}>{index + 1}</td>
                          <td style={styles.td}>
                            {appointment.user?.fullName || appointment.patientId}
                          </td>
                          <td style={styles.td}>
                            {appointment.user?.phone || 'Không có'}
                          </td>
                          <td style={styles.td}>
                            {formatDate(appointment.date)}
                          </td>
                          <td style={styles.td}>
                            {appointment.slot ? 
                              `${formatTime(appointment.slot.startTime)} - ${formatTime(appointment.slot.endTime)}` : 
                              'Không có'
                            }
                          </td>
                          <td style={styles.td}>
                            {appointment.clinic?.name || 'Không có'}
                          </td>
                          <td style={styles.td}>
                            <span style={getStatusBadge(appointment.status)}>
                              {getStatusLabel(appointment.status)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <button 
                              style={{ ...styles.btn, ...styles.callBtn }}
                              onClick={() => callNextPatient(appointment)}
                            >
                              Gọi số
                            </button>
                            
                            {appointment.status === 'approved' && (
                              <button 
                                style={{ ...styles.btn, ...styles.waitingBtn }}
                                onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                              >
                                Bắt đầu khám
                              </button>
                            )}
                            
                            {appointment.status === 'in_progress' && (
                              <button 
                                style={{ ...styles.btn, ...styles.completeBtn }}
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              >
                                Hoàn thành
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'called' && (
          <div>
            <h3>Số đã gọi hôm nay</h3>
            {calledPatients.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Chưa có bệnh nhân nào được gọi
              </p>
            ) : (
              calledPatients.map((patient, index) => (
                <div key={index} style={styles.calledPatientCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{patient.user?.fullName || patient.patientId}</strong>
                      <br />
                      <small>SĐT: {patient.user?.phone || 'Không có'}</small>
                      <br />
                      <small>Giờ khám: {patient.slot ? 
                        `${formatTime(patient.slot.startTime)} - ${formatTime(patient.slot.endTime)}` : 
                        'Không có'
                      }</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <small>Gọi lúc: {patient.calledTime}</small>
                      <br />
                      <span style={getStatusBadge(patient.status)}>
                        {getStatusLabel(patient.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3>Lịch sử hoạt động</h3>
            {callHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Chưa có hoạt động nào
              </p>
            ) : (
              callHistory.map((item, index) => (
                <div key={index} style={styles.historyItem}>
                  <div>
                    <strong>{item.user?.fullName || item.patientId}</strong>
                    <br />
                    <small>{item.action}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <small>{item.calledTime || item.updatedTime}</small>
                    <br />
                    <span style={getStatusBadge(item.status)}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal chi tiết bệnh nhân */}
      {showDetail && detailData && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setShowDetail(false)}>×</button>
            <h2>Thông tin bệnh nhân</h2>
            
            <div style={styles.modalSection}>
              <h3>Thông tin cá nhân</h3>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Họ tên:</span>
                <span style={styles.modalValue}>{detailData.user?.fullName || 'Không có'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>SĐT:</span>
                <span style={styles.modalValue}>{detailData.user?.phone || 'Không có'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Địa chỉ:</span>
                <span style={styles.modalValue}>{detailData.user?.ward || 'Không có'}</span>
              </div>
            </div>

            <div style={styles.modalSection}>
              <h3>Thông tin lịch khám</h3>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Ngày khám:</span>
                <span style={styles.modalValue}>{formatDate(detailData.date)}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Giờ khám:</span>
                <span style={styles.modalValue}>
                  {detailData.slot ? 
                    `${formatTime(detailData.slot.startTime)} - ${formatTime(detailData.slot.endTime)}` : 
                    'Không có'
                  }
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Phòng khám:</span>
                <span style={styles.modalValue}>{detailData.clinic?.name || 'Không có'}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Trạng thái:</span>
                <span style={styles.modalValue}>
                  <span style={getStatusBadge(detailData.status)}>
                    {getStatusLabel(detailData.status)}
                  </span>
                </span>
              </div>
            </div>

            {detailData.symptoms && (
              <div style={styles.modalSection}>
                <h3>Triệu chứng</h3>
                <p style={styles.modalValue}>{detailData.symptoms}</p>
              </div>
            )}

            {detailData.note && (
              <div style={styles.modalSection}>
                <h3>Ghi chú</h3>
                <p style={styles.modalValue}>{detailData.note}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {actionMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '15px 20px',
          backgroundColor: '#27ae60',
          color: 'white',
          borderRadius: '4px',
          zIndex: 1001
        }}>
          {actionMsg}
        </div>
      )}
    </div>
  );
}

export default DoctorAppointmentManagement; 