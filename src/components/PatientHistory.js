import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { useStatus } from "../context/StatusContext";

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
    cursor: 'pointer',
  },
  td: {
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    fontSize: 15,
    textAlign: 'left',
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
  modalLabel: {
    fontWeight: 600,
    color: '#3358e6',
    minWidth: 120,
    display: 'inline-block',
    textAlign: 'left',
  },
  modalValue: {
    fontWeight: 500,
    color: '#22336b',
    marginLeft: 8,
    textAlign: 'left',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalDaysTitle: {
    fontWeight: 600,
    color: '#3358e6',
    marginBottom: 12,
  },
  modalRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 8,
  },
  modalDaysTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  modalDaysTh: {
    background: '#f7fafd',
    fontWeight: 600,
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    color: '#3358e6',
  },
  modalDayDate: {
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    fontSize: 14,
    textAlign: 'left',
  },
  modalDayStatus: {
    padding: '8px 10px',
    border: '1px solid #e0e0e0',
    fontSize: 14,
    textAlign: 'left',
    fontWeight: 500,
  },
};

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

function PatientHistory() {
  const { getStatusLabel, statuses } = useStatus();
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState(null);
  const [detailDays, setDetailDays] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showPlan, setShowPlan] = useState(false);
  const [planDetail, setPlanDetail] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      // Query theo ngày
      let q = query(collection(db, "appointments"), where("patientId", "==", user.email));
      if (fromDate && toDate) {
        q = query(collection(db, "appointments"), where("patientId", "==", user.email), where("date", ">=", fromDate), where("date", "<=", toDate));
      } else if (fromDate) {
        q = query(collection(db, "appointments"), where("patientId", "==", user.email), where("date", ">=", fromDate));
      } else if (toDate) {
        q = query(collection(db, "appointments"), where("patientId", "==", user.email), where("date", "<=", toDate));
      }
      const apptSnap = await getDocs(q);
      const clinicSnap = await getDocs(collection(db, "clinics"));
      // Lấy thêm thông tin plan, protocol, slot, clinic cho từng appointment
      const appts = await Promise.all(apptSnap.docs.map(async docA => {
        const a = { id: docA.id, ...docA.data() };
        const planDoc = a.treatmentPlanId ? await getDoc(doc(db, "treatment_plans", a.treatmentPlanId)) : null;
        const plan = planDoc && planDoc.exists() ? planDoc.data() : {};
        const protocolDoc = plan.protocolId ? await getDoc(doc(db, "treatment_protocols", plan.protocolId)) : null;
        const protocol = protocolDoc && protocolDoc.exists() ? protocolDoc.data() : null;
        const slotDoc = a.timeSlotId ? await getDoc(doc(db, "time_slots", a.timeSlotId)) : null;
        const slot = slotDoc && slotDoc.exists() ? slotDoc.data() : {};
        const clinicDoc = a.clinicId ? await getDoc(doc(db, "clinics", a.clinicId)) : null;
        const clinic = clinicDoc && clinicDoc.exists() ? clinicDoc.data() : {};
        return { ...a, plan, protocol, slot, clinic };
      }));
      setAppointments(appts);
      setClinics(clinicSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [fromDate, toDate]);

  // Lọc dữ liệu
  let filtered = appointments.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      const clinic = a.clinic?.name || "";
      if (!(clinic.toLowerCase().includes(s)) && !(a.date && a.date.includes(s))) return false;
    }
    return true;
  });

  // Sau khi lọc, chỉ lấy appointment đầu tiên của mỗi phác đồ
  function getFirstAppointmentsByPlan(list) {
    const map = new Map();
    for (const a of list) {
      if (!a.treatmentPlanId) continue;
      if (!map.has(a.treatmentPlanId)) map.set(a.treatmentPlanId, a);
      else {
        // So sánh ngày, lấy ngày nhỏ nhất
        const old = map.get(a.treatmentPlanId);
        if (a.date < old.date) map.set(a.treatmentPlanId, a);
      }
    }
    return Array.from(map.values());
  }
  // Lấy các appointment đầu tiên của mỗi phác đồ
  const distincted = getFirstAppointmentsByPlan(filtered);
  // Sắp xếp lại theo ngày
  distincted.sort((a, b) => a.date > b.date ? 1 : -1);
  // Phân trang
  const totalPages = Math.ceil(distincted.length / rowsPerPage);
  const paginated = distincted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Modal chi tiết
  const handleShowDetail = (a) => {
    setDetailData(a);
    // Lấy danh sách các ngày trong phác đồ (appointments cùng treatmentPlanId)
    const days = appointments.filter(ap => ap.treatmentPlanId === a.treatmentPlanId)
      .map(ap => ({ date: ap.date, status: ap.status }))
      .sort((d1, d2) => new Date(d1.date) - new Date(d2.date));
    setDetailDays(days);
  };
  const handleCloseDetail = () => setDetailData(null);
  const handleSort = (field) => {
    if (sortField === field) setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Hàm mở modal phác đồ
  const handleShowPlan = async (a) => {
    // Lấy tất cả các appointments thuộc treatmentPlanId này
    const appts = appointments.filter(ap => ap.treatmentPlanId === a.treatmentPlanId)
      .sort((d1, d2) => new Date(d1.date) - new Date(d2.date));
    setPlanDetail({
      protocol: a.protocol,
      plan: a.plan,
      appointments: appts,
      adminNote: a.adminNote || (a.plan && a.plan.adminNote) || '',
    });
    setShowPlan(true);
  };
  const handleClosePlan = () => setShowPlan(false);

  return (
    <div style={styles.card}>
      <div style={styles.title}>Lịch sử đặt lịch khám</div>
      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <label style={styles.filterLabel}>Từ ngày:
            <input type="date" style={styles.filterInput} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </label>
          <label style={styles.filterLabel}>Đến ngày:
            <input type="date" style={styles.filterInput} value={toDate} onChange={e => setToDate(e.target.value)} />
          </label>
          <label style={styles.filterLabel}>Trạng thái:
            <select style={styles.filterInput} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Tất cả</option>
              {statuses.map(s => <option key={s.id} value={s.code}>{s.label}</option>)}
            </select>
          </label>
          <label style={styles.filterLabel}>Tìm kiếm:
            <input type="text" style={styles.filterInput} placeholder="Phòng khám, ngày" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
        </div>
      </div>
      {loading ? <div>Đang tải...</div> : (
        <>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => handleSort('date')}>Ngày khám</th>
              <th style={styles.th} onClick={() => handleSort('clinicName')}>Phòng khám</th>
              <th style={styles.th}>Khung giờ</th>
              <th style={styles.th}>Phác đồ</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={7}>Không có lịch khám phù hợp</td></tr>
            ) : paginated.map(a => (
              <tr key={a.id}>
                <td style={styles.td}>{formatDateDMY(a.date)}</td>
                <td style={styles.td}>{a.clinic?.name || ""}</td>
                <td style={styles.td}>{a.slot?.startTime && a.slot?.endTime ? `${a.slot.startTime} - ${a.slot.endTime}` : ""}</td>
                <td style={styles.td}>{a.protocol ? a.protocol.name : ""}</td>
                <td style={styles.td}>{getStatusLabel(a.plan?.status || a.status)}</td>
                <td style={styles.td}>
                  <button style={styles.detailBtn} onClick={() => handleShowDetail(a)}>Xem chi tiết</button>
                  <button style={styles.detailBtn} onClick={() => handleShowPlan(a)}>Xem phác đồ điều trị</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 16 }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trang trước</button>
          <span style={{ margin: '0 10px' }}>Trang {currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Trang sau</button>
        </div>
        </>
      )}
      {/* Modal chi tiết */}
      {detailData && (
        <div style={styles.modalOverlay} onClick={handleCloseDetail}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={handleCloseDetail}>&times;</button>
            <h3 style={{marginBottom: 28, color: '#22336b', fontWeight: 700}}>Chi tiết lịch khám</h3>
            <div style={styles.modalSection}>
              <div style={styles.modalDaysTitle}>Thông tin đăng ký</div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Phòng khám:</span><span style={styles.modalValue}>{detailData.clinic?.name || ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Khung giờ:</span><span style={styles.modalValue}>{detailData.slot?.startTime && detailData.slot?.endTime ? `${detailData.slot.startTime} - ${detailData.slot.endTime}` : ''}</span></div>
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
      {/* Modal phác đồ điều trị */}
      {showPlan && planDetail && (
        <div style={styles.modalOverlay} onClick={handleClosePlan}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={handleClosePlan}>&times;</button>
            <h3 style={{marginBottom: 24, color: '#22336b'}}>Chi tiết phác đồ điều trị</h3>
            <div style={styles.modalSection}>
              <div style={styles.modalDaysTitle}>Thông tin phác đồ</div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Tên phác đồ:</span><span style={styles.modalValue}>{planDetail.protocol?.name || ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Ngày bắt đầu:</span><span style={styles.modalValue}>{planDetail.plan?.startDate || ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Số ngày:</span><span style={styles.modalValue}>{planDetail.protocol?.days || ''}</span></div>
              <div style={styles.modalRow}><span style={styles.modalLabel}>Trạng thái:</span><span style={styles.modalValue}>{getStatusLabel(planDetail.plan?.status)}</span></div>
            </div>
            <div style={styles.modalSection}>
              <div style={styles.modalDaysTitle}>Danh sách các ngày khám</div>
              <table style={styles.modalDaysTable}>
                <thead>
                  <tr>
                    <th style={styles.modalDaysTh}>Ngày</th>
                    <th style={styles.modalDaysTh}>Phòng khám</th>
                    <th style={styles.modalDaysTh}>Khung giờ</th>
                    <th style={styles.modalDaysTh}>Trạng thái</th>
                    <th style={styles.modalDaysTh}>Triệu chứng</th>
                    <th style={styles.modalDaysTh}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {planDetail.appointments.length === 0 ? (
                    <tr><td colSpan={6}>Không có dữ liệu</td></tr>
                  ) : planDetail.appointments.map((d, idx) => (
                    <tr key={idx}>
                      <td style={styles.modalDayDate}>{d.date}</td>
                      <td style={styles.modalDayDate}>{d.clinic?.name || ''}</td>
                      <td style={styles.modalDayDate}>{d.slot?.startTime && d.slot?.endTime ? `${d.slot.startTime} - ${d.slot.endTime}` : ''}</td>
                      <td style={styles.modalDayStatus}>{getStatusLabel(d.status)}</td>
                      <td style={styles.modalDayDate}>{d.symptoms}</td>
                      <td style={styles.modalDayDate}>{d.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.modalSection}>
              <span style={styles.modalLabel}>Ghi chú QTV:</span>
              <span style={styles.modalValue}>{planDetail.adminNote || ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientHistory; 