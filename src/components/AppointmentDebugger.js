import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '20px'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
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
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
    minWidth: '80px'
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404'
  },
  statusApproved: {
    backgroundColor: '#d4edda',
    color: '#155724'
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
    color: '#721c24'
  }
};

function AppointmentDebugger() {
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllAppointments = async () => {
      setLoading(true);
      try {
        // Lấy tất cả appointments
        const snapshot = await getDocs(collection(db, 'appointments'));
        const appointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('All appointments:', appointments);
        setAllAppointments(appointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAppointments();
  }, []);

  const getStatusBadge = (status) => {
    const baseStyle = { ...styles.statusBadge };
    switch (status) {
      case 'pending':
        return { ...baseStyle, ...styles.statusPending };
      case 'approved':
        return { ...baseStyle, ...styles.statusApproved };
      case 'cancelled':
        return { ...baseStyle, ...styles.statusCancelled };
      default:
        return baseStyle;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return <div style={styles.container}>Đang tải...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Debug Appointments</h1>
      
      <div style={styles.section}>
        <h2>Tổng quan</h2>
        <p>Tổng số appointments: {allAppointments.length}</p>
        <p>Appointments đã duyệt: {allAppointments.filter(a => a.status === 'approved').length}</p>
        <p>Appointments chờ duyệt: {allAppointments.filter(a => a.status === 'pending').length}</p>
        <p>Appointments đã hủy: {allAppointments.filter(a => a.status === 'cancelled').length}</p>
      </div>

      <div style={styles.section}>
        <h2>Tất cả Appointments</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Patient ID</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Clinic ID</th>
              <th style={styles.th}>Time Slot ID</th>
              <th style={styles.th}>Symptoms</th>
            </tr>
          </thead>
          <tbody>
            {allAppointments.map((appointment) => (
              <tr key={appointment.id}>
                <td style={styles.td}>{appointment.id}</td>
                <td style={styles.td}>{appointment.patientId}</td>
                <td style={styles.td}>{formatDate(appointment.date)}</td>
                <td style={styles.td}>
                  <span style={getStatusBadge(appointment.status)}>
                    {appointment.status}
                  </span>
                </td>
                <td style={styles.td}>{appointment.clinicId}</td>
                <td style={styles.td}>{appointment.timeSlotId}</td>
                <td style={styles.td}>{appointment.symptoms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AppointmentDebugger; 