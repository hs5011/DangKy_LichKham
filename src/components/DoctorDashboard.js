import React, { useState } from "react";
import DoctorAppointmentManagement from "./DoctorAppointmentManagement";

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
    padding: '40px 0',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '32px 36px',
    minWidth: 400,
    maxWidth: 900,
    margin: '0 auto',
  },
  tabs: {
    display: 'flex',
    gap: 16,
    marginBottom: 24,
    borderBottom: '1px solid #e0e0e0',
  },
  tab: isActive => ({
    padding: '10px 24px',
    border: 'none',
    background: 'none',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#3358e6' : '#22336b',
    borderBottom: isActive ? '3px solid #3358e6' : '3px solid transparent',
    cursor: 'pointer',
    fontSize: 16,
    outline: 'none',
    transition: 'color 0.2s',
  }),
  content: {
    minHeight: 300,
    paddingTop: 16,
  },
  title: {
    fontWeight: 700,
    fontSize: 24,
    marginBottom: 18,
    color: '#22336b',
    letterSpacing: 0.5,
  },
};

const DOCTOR_MENUS = [
  { key: 'appointments', label: 'Quản lý lịch khám' },
];

function DoctorDashboard() {
  const [tabKey, setTabKey] = useState('appointments');

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)' }}>
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
            color: '#27ae60',
            textAlign: 'center',
          }}>
            BÁC SĨ
          </div>
          <div style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            marginTop: 4,
          }}>
            Menu quản lý lịch khám
          </div>
        </div>
        {DOCTOR_MENUS.map(m => (
          <button
            key={m.key}
            style={{
              background: tabKey === m.key ? 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)' : 'none',
              color: tabKey === m.key ? '#fff' : '#27ae60',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 16,
              padding: '14px 28px',
              textAlign: 'left',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              margin: '0 16px',
            }}
            onClick={() => setTabKey(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1,
        margin: '20px 20px 20px 0',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'auto',
      }}>
        <div style={{ padding: '32px 36px' }}>
          {tabKey === 'appointments' && <DoctorAppointmentManagement />}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard; 