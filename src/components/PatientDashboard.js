import React, { useState } from "react";
import BookAppointment from "./BookAppointment";
import PatientHistory from "./PatientHistory";
import TreatmentProgress from "./TreatmentProgress";
import RescheduleRequest from "./RescheduleRequest";
import Notifications from "./Notifications";
import PatientProfile from "./PatientProfile";

const styles = {
  container: {
    display: 'flex',
    minHeight: '80vh',
    background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
    padding: '40px 0',
  },
  sidebar: {
    width: 220,
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 2px 8px rgba(79,140,255,0.10)',
    marginLeft: 40,
    marginRight: 32,
    padding: '28px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: 'fit-content',
  },
  menuBtn: isActive => ({
    background: isActive ? 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)' : 'none',
    color: isActive ? '#fff' : '#3358e6',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 16,
    padding: '12px 32px', // tăng padding trái/phải
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap',
  }),
  content: {
    flex: 1,
    marginRight: 40,
  },
};

const MENUS = [
  { key: 'book', label: 'Đăng ký lịch khám bệnh' },
  { key: 'history', label: 'Lịch sử khám bệnh' },
  { key: 'progress', label: 'Tiến độ phác đồ điều trị' },
  { key: 'reschedule', label: 'Xin dời ngày khám bệnh' },
  { key: 'notifications', label: 'Thông báo' },
  { key: 'profile', label: 'Thông tin cá nhân' },
];

function PatientDashboard() {
  const [menu, setMenu] = useState('book');

  return (
    <div style={styles.container}>
      <div style={{
        width: 280,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        margin: '20px 0 20px 20px',
        padding: '32px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: 'fit-content',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
      }}>
        <div style={{
          padding: '0 24px 16px 24px',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: 8,
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: 18,
            color: '#3358e6',
            textAlign: 'center',
          }}>
            BỆNH NHÂN
          </div>
          <div style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            marginTop: 4,
          }}>
            Menu dịch vụ khám bệnh
          </div>
        </div>
        {MENUS.map(m => (
          <button
            key={m.key}
            style={styles.menuBtn(menu === m.key)}
            onClick={() => setMenu(m.key)}
            title={m.label}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div style={styles.content}>
        {menu === 'book' && <BookAppointment />}
        {menu === 'history' && <PatientHistory />}
        {menu === 'progress' && <TreatmentProgress />}
        {menu === 'reschedule' && <RescheduleRequest />}
        {menu === 'notifications' && <Notifications />}
        {menu === 'profile' && <PatientProfile />}
      </div>
    </div>
  );
}

export default PatientDashboard; 