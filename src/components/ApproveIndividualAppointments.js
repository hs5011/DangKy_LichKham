import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  orderBy
} from "firebase/firestore";
import { useStatus } from "../context/StatusContext";

const styles = {
  container: {
    padding: '20px',
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
    marginTop: 10,
  },
  th: {
    background: '#f7fafd',
    fontWeight: 700,
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
  },
  td: {
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    fontSize: 15,
    textAlign: 'center',
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
  approve: {
    background: 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)',
    color: '#fff',
  },
  reject: {
    background: '#e53935',
    color: '#fff',
  },
  detailBtn: {
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
    maxWidth: 600,
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    position: 'relative',
    maxHeight: '80vh',
    overflow: 'auto',
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
  modalSection: {
    marginBottom: 20,
  },
  modalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 17,
  },
  modalLabel: {
    fontWeight: 600,
    color: '#22336b',
  },
  modalValue: {
    color: '#666',
  },
  modalDaysTitle: {
    fontWeight: 700,
    color: '#3358e6',
    marginBottom: 8,
    fontSize: 17,
  },
  modalDaysTable: {
    width: '100%',
    background: '#f7fafd',
    borderRadius: 8,
    padding: '0',
    fontSize: 15,
    borderCollapse: 'collapse',
  },
  modalDaysTh: {
    color: '#3358e6',
    fontWeight: 600,
    padding: '8px 10px',
    borderBottom: '1px solid #e0e0e0',
    textAlign: 'left',
  },
  modalDayDate: {
    padding: '8px 10px',
    borderBottom: '1px solid #e0e0e0',
  },
  modalDayStatus: {
    padding: '8px 10px',
    borderBottom: '1px solid #e0e0e0',
    fontWeight: 600,
  },
  statusPending: {
    color: '#ff9800',
  },
  statusApproved: {
    color: '#4caf50',
  },
  statusCancelled: {
    color: '#f44336',
  },
  statusCompleted: {
    color: '#2196f3',
  },
};

function ApproveIndividualAppointments() {
  const { getStatusLabel, statuses } = useStatus();
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy danh sách phòng khám cho filter
        const clinicSnap = await getDocs(collection(db, "clinics"));
        setClinics(clinicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Lấy danh sách appointments với status pending
        const q = query(
          collection(db, "appointments"),
          where("status", "==", "pending"),
          orderBy("date", "asc")
        );
        const snap = await getDocs(q);
        const data = [];
        
        for (const docA of snap.docs) {
          const a = { id: docA.id, ...docA.data() };
          
          // Lấy thông tin user, clinic, time_slot
          const userDoc = await getDoc(doc(db, "users", a.patientId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          const clinicDoc = await getDoc(doc(db, "clinics", a.clinicId));
          const clinicData = clinicDoc.exists() ? clinicDoc.data() : {};
          
          const slotDoc = await getDoc(doc(db, "time_slots", a.timeSlotId));
          const slotData = slotDoc.exists() ? slotDoc.data() : {};
          
          // Lấy thông tin treatment plan và protocol
          let planData = {};
          let protocolData = {};
          if (a.treatmentPlanId) {
            const planDoc = await getDoc(doc(db, "treatment_plans", a.treatmentPlanId));
            if (planDoc.exists()) {
              planData = planDoc.data();
              if (planData.protocolId) {
                const protocolDoc = await getDoc(doc(db, "treatment_protocols", planData.protocolId));
                if (protocolDoc.exists()) {
                  protocolData = protocolDoc.data();
                }
              }
            }
          }
          
          data.push({
            ...a,
            user: userData,
            clinic: clinicData,
            slot: slotData,
            plan: planData,
            protocol: protocolData,
          });
        }
        
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setActionMsg("Lỗi khi tải dữ liệu: " + error.message);
      }
      setLoading(false);
    };
    fetchData();
  }, [actionMsg]);

  // Lọc dữ liệu theo ngày, phòng khám, tìm kiếm
  useEffect(() => {
    let filtered = appointments;
    
    if (filterDate) {
      filtered = filtered.filter(a => a.date === filterDate);
    }
    if (filterClinic) {
      filtered = filtered.filter(a => a.clinicId === filterClinic);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(a =>
        (a.user.fullName && a.user.fullName.toLowerCase().includes(s)) ||
        (a.user.phone && a.user.phone.includes(s))
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(a => a.status === filterStatus);
    }
    
    setAppointments(filtered);
  }, [appointments, filterStatus, filterDate, filterClinic, search]);

  const handleApprove = async (id) => {
    setActionMsg("");
    const approvedStatus = statuses.find(s => s.code === 'approved');
    if (!approvedStatus) throw new Error("Không tìm thấy trạng thái approved!");
    
    // Chỉ duyệt appointment cụ thể
    await updateDoc(doc(db, "appointments", id), { status: approvedStatus.code });
    setActionMsg("Đã duyệt lịch khám!");
  };

  const handleReject = async (id, reason) => {
    setActionMsg("");
    const cancelledStatus = statuses.find(s => s.code === 'cancelled');
    if (!cancelledStatus) throw new Error("Không tìm thấy trạng thái cancelled!");
    
    await updateDoc(doc(db, "appointments", id), { 
      status: cancelledStatus.code, 
      adminNote: reason 
    });
    setActionMsg("Đã từ chối lịch khám!");
  };

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  let sortedAppointments = [...appointments];
  if (sortField) {
    sortedAppointments.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (sortField === 'fullName') {
        valA = a.user.fullName || '';
        valB = b.user.fullName || '';
      }
      if (sortField === 'clinicName') {
        valA = a.clinic.name || '';
        valB = b.clinic.name || '';
      }
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      else return valA < valB ? 1 : -1;
    });
  }
  
  const paginatedAppointments = sortedAppointments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(appointments.length / rowsPerPage);

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

  const handleShowDetail = (a) => {
    setDetailData(a);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setDetailData(null);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'approved': return styles.statusApproved;
      case 'cancelled': return styles.statusCancelled;
      case 'completed': return styles.statusCompleted;
      default: return {};
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <label style={styles.filterLabel}>Trạng thái:
            <select style={styles.filterInput} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Tất cả</option>
              {statuses.map(s => <option key={s.id} value={s.code}>{s.label}</option>)}
            </select>
          </label>
          <label style={styles.filterLabel}>Ngày khám:
            <input type="date" style={styles.filterInput} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </label>
          <label style={styles.filterLabel}>Phòng khám:
            <select style={styles.filterInput} value={filterClinic} onChange={e => setFilterClinic(e.target.value)}>
              <option value="">Tất cả</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label style={styles.filterLabel}>Tìm kiếm:
            <input type="text" style={styles.filterInput} placeholder="Tên/SĐT" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
        </div>
      </div>

      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : paginatedAppointments.length === 0 ? (
        <div>Không có lịch khám nào đang chờ duyệt.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => handleSort('fullName')}>Họ tên bệnh nhân</th>
              <th style={styles.th}>SĐT</th>
              <th style={styles.th} onClick={() => handleSort('date')}>Ngày khám</th>
              <th style={styles.th}>Phòng khám</th>
              <th style={styles.th}>Khung giờ</th>
              <th style={styles.th}>Phác đồ</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAppointments.map(a => (
              <tr key={a.id}>
                <td style={styles.td}>{a.user.fullName || a.patientId}</td>
                <td style={styles.td}>{a.user.phone || ""}</td>
                <td style={styles.td}>{formatDateDMY(a.date)}</td>
                <td style={styles.td}>{a.clinic.name || ""}</td>
                <td style={styles.td}>{a.slot.startTime} - {a.slot.endTime}</td>
                <td style={styles.td}>{a.protocol ? a.protocol.name : ""}</td>
                <td style={styles.td}>
                  <span style={getStatusStyle(a.status)}>
                    {getStatusLabel(a.status)}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={{ ...styles.btn, ...styles.approve }} onClick={() => setConfirmAction({type: 'approve', a})}>
                    Duyệt
                  </button>
                  <button style={{ ...styles.btn, ...styles.reject }} onClick={() => setConfirmAction({type: 'reject', a})}>
                    Từ chối
                  </button>
                  <button style={styles.detailBtn} onClick={() => handleShowDetail(a)}>
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {actionMsg && <div style={{ color: '#3358e6', marginTop: 12 }}>{actionMsg}</div>}
      
      <div style={{ marginTop: 16 }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trang trước</button>
        <span style={{ margin: '0 10px' }}>Trang {currentPage} / {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Trang sau</button>
      </div>

      {/* Modal chi tiết */}
      {showDetail && detailData && (
        <div style={styles.modalOverlay} onClick={handleCloseDetail}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={handleCloseDetail}>&times;</button>
            <h3 style={{marginBottom: 28, color: '#22336b', fontWeight: 700}}>Chi tiết lịch khám</h3>
            <div style={styles.modalSection}>
              <div style={styles.modalDaysTitle}>Thông tin đăng ký</div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Họ tên:</span><span style={styles.modalValue}>{detailData.user.fullName || detailData.patientId}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>SĐT:</span><span style={styles.modalValue}>{detailData.user.phone || ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Phường/Xã:</span><span style={styles.modalValue}>{detailData.user.ward || ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Phòng khám:</span><span style={styles.modalValue}>{detailData.clinic.name || ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Khung giờ:</span><span style={styles.modalValue}>{detailData.slot.startTime} - {detailData.slot.endTime}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Triệu chứng:</span><span style={styles.modalValue}>{detailData.symptoms}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Ghi chú:</span><span style={styles.modalValue}>{detailData.note}</span></div>
            </div>
            <div style={styles.modalSection}>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Phác đồ:</span><span style={styles.modalValue}>{detailData.protocol ? detailData.protocol.name : ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Số ngày:</span><span style={styles.modalValue}>{detailData.protocol ? detailData.protocol.days : ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Ngày tạo:</span><span style={styles.modalValue}>{detailData.createdAt && detailData.createdAt.seconds ? formatDateDMY(new Date(detailData.createdAt.seconds * 1000)) : ''}</span></div>
            </div>
            <div style={styles.modalSection}>
              <span style={styles.modalLabel}>Ghi chú QTV:</span>
              <span style={styles.modalValue}>{detailData.adminNote || ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận duyệt/từ chối */}
      {confirmAction && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modal, minWidth: 350, maxWidth: 400, textAlign: 'center'}}>
            <button style={styles.closeBtn} onClick={() => {setConfirmAction(null); setRejectReason("");}}>&times;</button>
            {confirmAction.type === 'approve' ? (
              <>
                <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>Xác nhận duyệt lịch khám?</div>
                <div style={{marginBottom: 24}}>
                  Bạn có chắc chắn muốn <span style={{color: '#3358e6', fontWeight: 700}}>DUYỆT</span> lịch khám cho bệnh nhân <b>{confirmAction.a.user.fullName || confirmAction.a.patientId}</b>?
                  <br/>
                  <small style={{color: '#666'}}>Ngày: {formatDateDMY(confirmAction.a.date)}</small>
                </div>
                <button style={{...styles.btn, ...styles.approve, minWidth: 90}} onClick={async () => {
                  await handleApprove(confirmAction.a.id);
                  setConfirmAction(null);
                }}>Xác nhận</button>
              </>
            ) : (
              <>
                <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>Xác nhận từ chối lịch khám?</div>
                <div style={{marginBottom: 16}}>
                  Bạn có chắc chắn muốn <span style={{color: '#e53935', fontWeight: 700}}>TỪ CHỐI</span> lịch khám cho bệnh nhân <b>{confirmAction.a.user.fullName || confirmAction.a.patientId}</b>?
                  <br/>
                  <small style={{color: '#666'}}>Ngày: {formatDateDMY(confirmAction.a.date)}</small>
                </div>
                <textarea style={{width: '90%', minHeight: 60, borderRadius: 6, border: '1px solid #bfc9d9', padding: 8, marginBottom: 16}} placeholder="Nhập lý do từ chối..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                <br/>
                <button style={{...styles.btn, ...styles.reject, minWidth: 90}} disabled={!rejectReason.trim()} onClick={async () => {
                  await handleReject(confirmAction.a.id, rejectReason);
                  setConfirmAction(null);
                  setRejectReason("");
                }}>Xác nhận từ chối</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApproveIndividualAppointments; 