import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { useStatus } from "../context/StatusContext";

const styles = {
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
    borderRadius: 14,
    padding: '36px 40px',
    minWidth: 420,
    maxWidth: 650,
    boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
    position: 'relative',
    fontSize: 16,
    textAlign: 'left',
  },
  modalSection: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  modalRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 0,
  },
  modalLabel: {
    fontWeight: 600,
    color: '#3358e6',
    minWidth: 160,
    display: 'inline-block',
    textAlign: 'left',
  },
  modalValue: {
    fontWeight: 500,
    color: '#22336b',
    marginLeft: 8,
    textAlign: 'left',
  },
  modalDays: {
    marginTop: 10,
    textAlign: 'left',
    background: '#f7fafd',
    borderRadius: 8,
    padding: '12px 18px',
    fontSize: 15,
  },
  modalDayRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e0e0e0',
    padding: '6px 0',
  },
  modalDayDate: {
    fontWeight: 600,
    color: '#3358e6',
  },
  modalDayStatus: {
    fontWeight: 500,
    color: '#22336b',
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
  loading: {
    margin: '20px 0',
    color: '#3358e6',
    fontWeight: 500,
  },
  empty: {
    margin: '20px 0',
    color: '#888',
    fontWeight: 500,
  },
  modalDaysTitle: {
    fontWeight: 700,
    color: '#e53935',
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
};

function ApproveAppointments() {
  const { getStatusLabel, statuses } = useStatus();
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' hoặc 'desc'
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailDays, setDetailDays] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // {type: 'approve'|'reject', a: appointment}
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Lấy danh sách phòng khám cho filter
      const clinicSnap = await getDocs(collection(db, "clinics"));
      setClinics(clinicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Lấy danh sách appointments status=pending
      const q = query(collection(db, "appointments"));
      const snap = await getDocs(q);
      const data = [];
      for (const docA of snap.docs) {
        const a = { id: docA.id, ...docA.data() };
        // Lấy thêm thông tin user, clinic, time_slot, treatment_plan, protocol
        const userDoc = await getDoc(doc(db, "users", a.patientId));
        console.log('userDoc.exists:', userDoc.exists(), a.patientId);
        if (userDoc.exists()) {
          console.log('userDoc.data:', userDoc.data());
        }
        const userData = userDoc.exists() ? userDoc.data() : {};
        const clinicDoc = await getDoc(doc(db, "clinics", a.clinicId));
        const slotDoc = await getDoc(doc(db, "time_slots", a.timeSlotId));
        let planDoc = null;
        let protocolDoc = null;
        if (a.treatmentPlanId) {
          planDoc = await getDoc(doc(db, "treatment_plans", a.treatmentPlanId));
          if (planDoc.exists()) {
            const planData = planDoc.data();
            const protocolId = planData.protocolId || planData.protocolID || planData.protocol_id || null;
            if (protocolId) protocolDoc = await getDoc(doc(db, "treatment_protocols", protocolId));
          }
        }
        data.push({
          ...a,
          user: userData,
          clinic: clinicDoc.exists() ? clinicDoc.data() : {},
          slot: slotDoc.exists() ? slotDoc.data() : {},
          plan: planDoc && planDoc.exists() ? planDoc.data() : {},
          protocol: protocolDoc && protocolDoc.exists() ? protocolDoc.data() : null,
        });
      }
      setAllAppointments(data);
      setLoading(false);
    };
    fetchData();
  }, [actionMsg]);

  // Lọc unique theo patientId, startDate, protocolId
  function getDistinctAppointments(list) {
    const map = new Map();
    for (const a of list) {
      const key = `${a.patientId}|${a.treatmentPlanId}`;
      if (!map.has(key)) map.set(key, a);
    }
    return Array.from(map.values());
  }

  // Lọc dữ liệu theo ngày, phòng khám, tìm kiếm
  useEffect(() => {
    let filtered = allAppointments;
    if (filterStatus) {
      filtered = filtered.filter(a => a.plan && a.plan.status ? a.plan.status === filterStatus : a.status === filterStatus);
    }
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
    // Lọc distinct
    filtered = getDistinctAppointments(filtered);
    setAppointments(filtered);
  }, [allAppointments, filterStatus, filterDate, filterClinic, search]);

  const handleApprove = async (id, planId) => {
    setActionMsg("");
    const approvedStatus = statuses.find(s => s.code === 'approved');
    if (!approvedStatus) throw new Error("Không tìm thấy trạng thái approved!");
    
    try {
      // Duyệt appointment cụ thể
      await updateDoc(doc(db, "appointments", id), { status: approvedStatus.code });
      
      // Nếu có treatment plan, duyệt tất cả appointments trong plan đó
      if (planId) {
        // Cập nhật treatment plan status
        await updateDoc(doc(db, "treatment_plans", planId), { status: approvedStatus.code });
        
        // Duyệt tất cả appointments có cùng treatmentPlanId
        const appointmentsToUpdate = allAppointments.filter(ap => ap.treatmentPlanId === planId);
        for (const appointment of appointmentsToUpdate) {
          await updateDoc(doc(db, "appointments", appointment.id), { status: approvedStatus.code });
        }
      }
      
      setActionMsg("Đã duyệt lịch khám và tất cả các buổi trong phác đồ!");
      
      // Refresh dữ liệu sau khi duyệt
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error approving appointment:', error);
      setActionMsg("Lỗi khi duyệt lịch khám: " + error.message);
    }
  };
  const handleReject = async (id, reason) => {
    setActionMsg("");
    const cancelledStatus = statuses.find(s => s.code === 'cancelled');
    if (!cancelledStatus) throw new Error("Không tìm thấy trạng thái cancelled!");
    
    try {
      // Tìm appointment cụ thể
      const appointment = allAppointments.find(ap => ap.id === id);
      if (!appointment) throw new Error("Không tìm thấy appointment!");
      
      // Từ chối appointment cụ thể
      await updateDoc(doc(db, "appointments", id), { status: cancelledStatus.code, adminNote: reason });
      
      // Từ chối tất cả appointments của bệnh nhân này
      const patientAppointments = allAppointments.filter(ap => ap.patientId === appointment.patientId);
      for (const ap of patientAppointments) {
        await updateDoc(doc(db, "appointments", ap.id), { 
          status: cancelledStatus.code, 
          adminNote: reason 
        });
      }
      
      // Cập nhật tất cả treatment plans của bệnh nhân này
      const patientTreatmentPlans = new Set();
      patientAppointments.forEach(ap => {
        if (ap.treatmentPlanId) {
          patientTreatmentPlans.add(ap.treatmentPlanId);
        }
      });
      
      for (const planId of patientTreatmentPlans) {
        await updateDoc(doc(db, "treatment_plans", planId), { 
          status: cancelledStatus.code, 
          adminNote: reason 
        });
      }
      
      setActionMsg("Đã từ chối tất cả lịch khám của bệnh nhân!");
      
      // Refresh dữ liệu sau khi từ chối
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      setActionMsg("Lỗi khi từ chối lịch khám: " + error.message);
    }
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

  // Hàm định dạng ngày dd/mm/yyyy
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

  // Khi click xem chi tiết
  const handleShowDetail = (a) => {
    setDetailData(a);
    // Lấy danh sách các ngày trong phác đồ (appointments cùng treatmentPlanId)
    const days = allAppointments.filter(ap => ap.treatmentPlanId === a.treatmentPlanId)
      .map(ap => ({
        date: ap.date,
        status: ap.status,
      }))
      .sort((d1, d2) => new Date(d1.date) - new Date(d2.date));
    setDetailDays(days);
    setShowDetail(true);
  };
  const handleCloseDetail = () => {
    setShowDetail(false);
    setDetailData(null);
  };

  return (
    <div>
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
        <div style={styles.loading}>Đang tải dữ liệu...</div>
      ) : paginatedAppointments.length === 0 ? (
        <div style={styles.empty}>Không có lịch khám nào đang chờ duyệt.</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => handleSort('fullName')}>Họ tên bệnh nhân</th>
              <th style={styles.th}>SĐT</th>
              <th style={styles.th} onClick={() => handleSort('date')}>Ngày đăng ký khám</th>
              <th style={styles.th}>Phác đồ</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAppointments.map(a => {
              console.log('Render:', a.patientId, a.user, a.user.phone);
              return (
                <tr key={a.id}>
                  <td style={styles.td}>{a.user.fullName || a.patientId}</td>
                  <td style={styles.td}>{a.user.phone || ""}</td>
                  <td style={styles.td}>{a.plan && a.plan.startDate ? formatDateDMY(a.plan.startDate) : formatDateDMY(a.date)}</td>
                  <td style={styles.td}>{a.protocol ? a.protocol.name : ""}</td>
                  <td style={styles.td}>{getStatusLabel(a.plan.status || a.status)}</td>
                  <td style={styles.td}>
                    {(a.plan.status || a.status) !== 'approved' && (
                      <button style={{ ...styles.btn, ...styles.approve }} onClick={() => setConfirmAction({type: 'approve', a})}>Duyệt</button>
                    )}
                    {(a.plan.status || a.status) !== 'cancelled' && (
                      <button style={{ ...styles.btn, ...styles.reject }} onClick={() => setConfirmAction({type: 'reject', a})}>Từ chối</button>
                    )}
                    <button style={styles.detailBtn} onClick={() => handleShowDetail(a)}>Xem chi tiết</button>
                  </td>
                </tr>
              );
            })}
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
              <div style={styles.modalRow}><span style={styles.modalLabel}>Trạng thái phác đồ:</span><span style={styles.modalValue}>{getStatusLabel(detailData.plan.status || detailData.status)}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Số ngày:</span><span style={styles.modalValue}>{detailData.protocol ? detailData.protocol.days : ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Số lần dời:</span><span style={styles.modalValue}>{detailData.rescheduleCount || 0}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Ngày tạo:</span><span style={styles.modalValue}>{detailData.createdAt && detailData.createdAt.seconds ? formatDateDMY(new Date(detailData.createdAt.seconds * 1000)) : ''}</span></div>
            </div>
            <div style={styles.modalSection}>
              <div style={styles.modalDaysTitle}>Danh sách các ngày theo phác đồ:</div>
              <table style={styles.modalDaysTable}>
                <thead>
                  <tr>
                    <th style={styles.modalDaysTh}>Ngày đăng khám</th>
                    <th style={styles.modalDaysTh}>Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {detailDays.length === 0 ? (
                    <tr><td colSpan={2}>Không có dữ liệu</td></tr>
                  ) : detailDays.map((d, idx) => (
                    <tr key={idx}>
                      <td style={styles.modalDayDate}>{formatDateDMY(d.date)}</td>
                      <td style={styles.modalDayStatus}>{getStatusLabel(d.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <br/><br/>
                  <div style={{color: '#ff6b35', fontWeight: 600, fontSize: 14}}>
                    ⚠️ Lưu ý: Hành động này sẽ duyệt TẤT CẢ các buổi khám trong phác đồ điều trị!
                  </div>
                  <div style={{color: '#666', fontSize: 13, marginTop: 8}}>
                    Phác đồ: {confirmAction.a.protocol ? confirmAction.a.protocol.name : 'Không có'}
                    <br/>
                    Số buổi: {detailDays ? detailDays.length : 0} buổi
                  </div>
                </div>
                <button style={{...styles.btn, ...styles.approve, minWidth: 90}} onClick={async () => {
                  await handleApprove(confirmAction.a.id, confirmAction.a.treatmentPlanId);
                  setConfirmAction(null);
                }}>Xác nhận duyệt tất cả</button>
              </>
            ) : (
              <>
                <div style={{fontWeight: 600, fontSize: 18, marginBottom: 18}}>Xác nhận từ chối lịch khám?</div>
                <div style={{marginBottom: 16}}>
                  Bạn có chắc chắn muốn <span style={{color: '#e53935', fontWeight: 700}}>TỪ CHỐI</span> lịch khám cho bệnh nhân <b>{confirmAction.a.user.fullName || confirmAction.a.patientId}</b>?
                  <br/><br/>
                  <div style={{color: '#ff6b35', fontWeight: 600, fontSize: 14}}>
                    ⚠️ Lưu ý: Hành động này sẽ từ chối TẤT CẢ các lịch khám của bệnh nhân này!
                  </div>
                  <div style={{color: '#666', fontSize: 13, marginTop: 8}}>
                    Bệnh nhân: {confirmAction.a.user.fullName || confirmAction.a.patientId}
                    <br/>
                    SĐT: {confirmAction.a.user.phone || 'Không có'}
                  </div>
                </div>
                <textarea style={{width: '90%', minHeight: 60, borderRadius: 6, border: '1px solid #bfc9d9', padding: 8, marginBottom: 16}} placeholder="Nhập lý do từ chối..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                <br/>
                <button style={{...styles.btn, ...styles.reject, minWidth: 90}} disabled={!rejectReason.trim()} onClick={async () => {
                  await handleReject(confirmAction.a.id, rejectReason);
                  setConfirmAction(null);
                  setRejectReason("");
                }}>Xác nhận từ chối tất cả</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApproveAppointments; 