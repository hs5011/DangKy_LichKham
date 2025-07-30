import React, { useState } from "react";
import ApproveAppointments from "./ApproveAppointments";
import ApproveIndividualAppointments from "./ApproveIndividualAppointments";
import ConfigClinics from "./ConfigClinics";
import ConfigTimeSlots from "./ConfigTimeSlots";
import ConfigWards from "./ConfigWards";
import ConfigProtocols from "./ConfigProtocols";
import StatsDashboard from "./StatsDashboard";
import DetailedStats from "./DetailedStats";
import UserManagement from "./UserManagement";
import StatusCatalogManagement from "./StatusCatalogManagement";
import SendNotification from "./SendNotification";

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
  configTabs: {
    display: 'flex',
    gap: 12,
    marginBottom: 18,
  },
  configTab: isActive => ({
    padding: '7px 18px',
    border: 'none',
    background: isActive ? '#3358e6' : '#f7fafd',
    color: isActive ? '#fff' : '#3358e6',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    outline: 'none',
    transition: 'background 0.2s',
  }),
};

const CONFIG_TABS = [
  { key: 'clinics', label: 'Phòng khám' },
  { key: 'time_slots', label: 'Khung giờ' },
  { key: 'wards', label: 'Phường/Xã' },
  { key: 'protocols', label: 'Phác đồ điều trị' },
];

const LEFT_MENUS = [
  { key: 'users', label: 'Quản lý tài khoản' },
  { key: 'approve', label: 'Duyệt lịch khám (Phác đồ)' },
  { key: 'approve-individual', label: 'Duyệt từng buổi khám' },
  { key: 'config', label: 'Quản lý cấu hình' },
  { key: 'status', label: 'Quản lý trạng thái' },
  { key: 'stats', label: 'Thống kê cơ bản' },
  { key: 'detailed-stats', label: 'Thống kê chi tiết' },
  { key: 'notify', label: 'Gửi thông báo' },
];

function AdminDashboard() {
  const [tabKey, setTabKey] = useState('approve');
  const [configTab, setConfigTab] = useState('clinics');

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
            color: '#3358e6',
            textAlign: 'center',
          }}>
            QUẢN TRỊ VIÊN
          </div>
          <div style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            marginTop: 4,
          }}>
            Menu quản lý hệ thống
          </div>
        </div>
        {LEFT_MENUS.map(m => (
          <button
            key={m.key}
            style={{
              background: tabKey === m.key ? 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)' : 'none',
              color: tabKey === m.key ? '#fff' : '#3358e6',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 16,
              padding: '14px 28px',
              textAlign: 'left',
              cursor: 'pointer',
              margin: '0 16px',
              transition: 'background 0.2s',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setTabKey(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, margin: '20px 20px 20px 0', overflow: 'hidden' }}>
        <div style={styles.card}>
          <div style={styles.title}>Quản trị viên - Dashboard</div>
          <div style={styles.content}>
            {tabKey === 'users' && <UserManagement />}
            {tabKey === 'approve' && <ApproveAppointments />}
            {tabKey === 'approve-individual' && <ApproveIndividualAppointments />}
            {tabKey === 'config' && (
              <>
                <div style={styles.configTabs}>
                  {CONFIG_TABS.map(t => (
                    <button
                      key={t.key}
                      style={styles.configTab(configTab === t.key)}
                      onClick={() => setConfigTab(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {configTab === 'clinics' && <ConfigClinics />}
                {configTab === 'time_slots' && <ConfigTimeSlots />}
                {configTab === 'wards' && <ConfigWards />}
                {configTab === 'protocols' && <ConfigProtocols />}
              </>
            )}
            {tabKey === 'status' && <StatusCatalogManagement />}
            {tabKey === 'stats' && <StatsDashboard />}
            {tabKey === 'detailed-stats' && <DetailedStats />}
            {tabKey === 'notify' && <SendNotification />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 