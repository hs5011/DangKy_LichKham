import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(79,140,255,0.10)',
    padding: '28px 32px',
    minWidth: 400,
    maxWidth: 1200,
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
    padding: '12px 10px',
    border: '1px solid #e0e0e0',
    color: '#3358e6',
    textAlign: 'left',
  },
  td: {
    padding: '12px 10px',
    border: '1px solid #e0e0e0',
    fontSize: 14,
    textAlign: 'left',
    verticalAlign: 'top',
  },
  btn: {
    background: '#fff',
    color: '#3358e6',
    border: '1px solid #3358e6',
    fontWeight: 600,
    fontSize: 14,
    borderRadius: 5,
    padding: '8px 16px',
    cursor: 'pointer',
    margin: '0 4px',
  },
  approveBtn: {
    background: '#27ae60',
    color: '#fff',
    border: '1px solid #27ae60',
  },
  rejectBtn: {
    background: '#e74c3c',
    color: '#fff',
    border: '1px solid #e74c3c',
  },
  statusBadge: {
    fontWeight: 'bold',
    fontSize: '13px',
    textAlign: 'center',
    minWidth: '80px',
  },
  statusPending: {
    color: '#856404',
  },
  statusApproved: {
    color: '#27ae60',
  },
  statusRejected: {
    color: '#e74c3c',
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
    minWidth: 500,
    maxWidth: 700,
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
  message: {
    color: '#388e3c',
    marginBottom: 10,
    fontWeight: 500,
  },
  error: {
    color: '#e53935',
    marginBottom: 10,
    fontWeight: 500,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#3358e6',
    minWidth: '120px',
  },
  infoValue: {
    color: '#666',
  },
  changeHighlight: {
    fontWeight: 'bold',
    color: '#e67e22', // màu cam nổi bật
  },
};

function ApproveRescheduleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [clinics, setClinics] = useState([]);
  // Popup xác nhận
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  // State filter
  const [filterDate, setFilterDate] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchRescheduleRequests();
    fetchTimeSlots();
    fetchClinics();
  }, [message]);

  const fetchClinics = async () => {
    const snap = await getDocs(collection(db, "clinics"));
    setClinics(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchTimeSlots = async () => {
    const snap = await getDocs(collection(db, "time_slots"));
    setTimeSlots(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchRescheduleRequests = async () => {
    setLoading(true);
    try {
      // Lấy tất cả reschedule requests
      const requestsSnapshot = await getDocs(collection(db, 'reschedule_requests'));
      const requestsData = [];
      
      for (const doc of requestsSnapshot.docs) {
        const request = { id: doc.id, ...doc.data() };
        
        // Lấy thông tin appointment gốc
        if (request.appointmentId) {
          const appointmentDoc = await getDocs(query(
            collection(db, 'appointments'),
            where('__name__', '==', request.appointmentId)
          ));
          if (!appointmentDoc.empty) {
            request.appointment = appointmentDoc.docs[0].data();
          }
        }
        
        // Lấy thông tin bệnh nhân
        if (request.patientId) {
          const userDoc = await getDocs(query(
            collection(db, 'users'),
            where('email', '==', request.patientId)
          ));
          if (!userDoc.empty) {
            request.patient = userDoc.docs[0].data();
          }
        }
        
        requestsData.push(request);
      }
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching reschedule requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    setShowApproveConfirm(true);
  };
  const doApprove = async () => {
    try {
      if (selectedRequest.appointmentId) {
        await updateDoc(doc(db, 'appointments', selectedRequest.appointmentId), {
          date: selectedRequest.newDate,
          timeSlotId: selectedRequest.appointment?.timeSlotId,
          status: 'approved',
          updatedAt: new Date(),
        });
      }
      await updateDoc(doc(db, 'reschedule_requests', selectedRequest.id), {
        status: 'approved',
        approvedAt: new Date(),
      });
      setMessage("Đã duyệt yêu cầu dời lịch thành công!");
      setShowModal(false);
      setShowApproveConfirm(false);
    } catch (error) {
      setMessage("Lỗi: " + error.message);
      setShowApproveConfirm(false);
    }
  };

  const handleReject = async (request) => {
    setShowRejectConfirm(true);
    setRejectReason("");
  };
  const doReject = async () => {
    if (!rejectReason.trim()) {
      setMessage("Vui lòng nhập lý do từ chối!");
      return;
    }
    try {
      await updateDoc(doc(db, 'reschedule_requests', selectedRequest.id), {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectReason: rejectReason.trim(),
      });
      setMessage("Đã từ chối yêu cầu dời lịch!");
      setShowModal(false);
      setShowRejectConfirm(false);
    } catch (error) {
      setMessage("Lỗi: " + error.message);
      setShowRejectConfirm(false);
    }
  };

  const getStatusBadge = (status) => {
    const baseStyle = { ...styles.statusBadge };
    switch (status) {
      case 'pending':
        return { ...baseStyle, ...styles.statusPending };
      case 'approved':
        return { ...baseStyle, ...styles.statusApproved };
      case 'rejected':
        return { ...baseStyle, ...styles.statusRejected };
      default:
        return baseStyle;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Đã từ chối';
      default: return 'Không xác định';
    }
  };

  // Hàm lấy tên khung giờ từ id
  const getTimeSlotName = (id) => {
    if (!id) return '';
    const slot = timeSlots.find(s => s.id === id);
    if (!slot) return id;
    if (slot.startTime && slot.endTime) return `${slot.startTime}-${slot.endTime}`;
    return slot.name || id;
  };

  // Sửa hàm formatDate để nhận cả Firestore Timestamp và string
  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      const date = new Date(dateVal);
      if (isNaN(date.getTime())) return dateVal;
      return date.toLocaleDateString('vi-VN');
    }
    if (typeof dateVal === 'object' && dateVal.seconds) {
      const date = new Date(dateVal.seconds * 1000);
      return date.toLocaleDateString('vi-VN');
    }
    return '';
  };

  const openDetail = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setMessage("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  // Lọc requests theo tiêu chí
  const filteredRequests = requests.filter(r => {
    // Lọc theo trạng thái
    if (filterStatus && r.status !== filterStatus) return false;
    // Lọc theo ngày yêu cầu dời
    if (filterDate) {
      let reqDate = r.createdAt;
      if (reqDate && typeof reqDate === 'object' && reqDate.seconds) reqDate = dayjs(new Date(reqDate.seconds * 1000)).format('YYYY-MM-DD');
      else if (typeof reqDate === 'string') reqDate = dayjs(new Date(reqDate)).format('YYYY-MM-DD');
      else reqDate = '';
      if (reqDate !== filterDate) return false;
    }
    // Lọc theo phòng khám
    if (filterClinic && r.appointment?.clinicId !== filterClinic) return false;
    // Lọc theo tên bệnh nhân
    if (filterName && !(r.patient?.fullName || '').toLowerCase().includes(filterName.toLowerCase())) return false;
    // Lọc theo số điện thoại
    if (filterPhone && !(r.patient?.phone || '').includes(filterPhone)) return false;
    return true;
  });

  return (
    <div style={styles.card}>
      <div style={styles.title}>Duyệt yêu cầu dời lịch</div>
      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Trạng thái:<br/>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}>
              <option value="">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </label>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Ngày yêu cầu dời:<br/>
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
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Tên bệnh nhân:<br/>
            <input type="text" value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Nhập tên..." style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }} />
          </label>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#3358e6' }}>Số điện thoại:<br/>
            <input type="text" value={filterPhone} onChange={e => setFilterPhone(e.target.value)} placeholder="Nhập SĐT..." style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }} />
          </label>
        </div>
      </div>
      {message && <div style={message.startsWith('Lỗi') ? styles.error : styles.message}>{message}</div>}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
      ) : (
        <>
          {filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>Không có yêu cầu dời lịch nào chờ duyệt</h3>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Bệnh nhân</th>
                  <th style={styles.th}>SĐT</th>
                  <th style={styles.th}>Lịch cũ</th>
                  <th style={styles.th}>Lịch mới</th>
                  <th style={styles.th}>Lý do</th>
                  <th style={styles.th}>Ngày yêu cầu</th>
                  <th style={styles.th}>Trạng thái</th>
                  <th style={styles.th}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => (
                  <tr key={request.id}>
                    <td style={styles.td}>
                      {request.patient?.fullName || request.patientId}
                    </td>
                    <td style={styles.td}>
                      {request.patient?.phone || 'Không có'}
                    </td>
                    <td style={styles.td}>
                      <div>Ngày: {formatDate(request.oldDate)}</div>
                      <div>Giờ: {getTimeSlotName(request.oldTimeSlotId) || 'Không có'}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.changeHighlight}>
                        Ngày: {formatDate(request.newDate)}
                      </div>
                      <div style={styles.changeHighlight}>
                        Giờ: {getTimeSlotName(request.appointment?.timeSlotId) || 'Không có'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {request.reason || 'Không có'}
                    </td>
                    <td style={styles.td}>
                      {formatDate(request.createdAt)}
                    </td>
                    <td style={styles.td}>
                      <span style={getStatusBadge(request.status)}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button 
                        style={styles.btn} 
                        onClick={() => openDetail(request)}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* Modal chi tiết */}
      {showModal && selectedRequest && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closeModal}>&times;</button>
            <h3>Chi tiết yêu cầu dời lịch</h3>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Bệnh nhân:</span>
              <span style={styles.infoValue}>
                {selectedRequest.patient?.fullName || selectedRequest.patientId}
              </span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Số điện thoại:</span>
              <span style={styles.infoValue}>
                {selectedRequest.patient?.phone || 'Không có'}
              </span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Lịch hiện tại:</span>
              <span style={styles.infoValue}>
                {formatDate(selectedRequest.appointment?.date)} - {getTimeSlotName(selectedRequest.appointment?.timeSlotId) || 'Không có'}
              </span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Lịch mới:</span>
              <span style={styles.infoValue}>
                <span style={styles.changeHighlight}>
                  {formatDate(selectedRequest.newDate)} - {getTimeSlotName(selectedRequest.appointment?.timeSlotId) || 'Không có'}
                </span>
              </span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Lý do:</span>
              <span style={styles.infoValue}>
                {selectedRequest.reason || 'Không có'}
              </span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Ngày yêu cầu:</span>
              <span style={styles.infoValue}>
                {formatDate(selectedRequest.createdAt)}
              </span>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                style={{ ...styles.btn, ...styles.approveBtn }}
                onClick={() => handleApprove(selectedRequest)}
              >
                Duyệt
              </button>
              <button 
                style={{ ...styles.btn, ...styles.rejectBtn }}
                onClick={() => handleReject(selectedRequest)}
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Popup xác nhận duyệt */}
      {showApproveConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={{marginBottom: 18, fontWeight: 600}}>Bạn có chắc chắn muốn duyệt yêu cầu này không?</div>
            <div style={{textAlign: 'center'}}>
              <button style={{...styles.btn, ...styles.approveBtn, marginRight: 8}} onClick={doApprove}>Xác nhận</button>
              <button style={{...styles.btn}} onClick={()=>setShowApproveConfirm(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      {/* Popup nhập lý do từ chối */}
      {showRejectConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={{marginBottom: 12, fontWeight: 600}}>Nhập lý do từ chối:</div>
            <textarea style={{width: '100%', minHeight: 60, marginBottom: 16}} value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." />
            <div style={{textAlign: 'center'}}>
              <button style={{...styles.btn, ...styles.rejectBtn, marginRight: 8}} onClick={doReject}>Xác nhận từ chối</button>
              <button style={{...styles.btn}} onClick={()=>setShowRejectConfirm(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApproveRescheduleRequests; 