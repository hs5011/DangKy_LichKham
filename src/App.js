import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import PhonePasswordAuth from './components/PhonePasswordAuth';
import AdminDashboard from './components/AdminDashboard';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AppointmentDebugger from './components/AppointmentDebugger';
import Navbar from './components/Navbar';
import FCMRegistration from './components/FCMRegistration';
import FCMNotification from './components/FCMNotification';
import FCMTest from './components/FCMTest';
import { StatusProvider } from './context/StatusContext';

function App() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
      if (userAuth) {
        const userDoc = await getDoc(doc(db, 'users', userAuth.email));
        if (userDoc.exists()) {
          const uInfo = userDoc.data();
          setUserInfo(uInfo);
          setUser({ ...userAuth, role: uInfo.role || 'patient' });
        } else {
          setUser({ ...userAuth, role: 'patient' });
        }
      } else {
        setUser(null);
        setUserInfo(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <StatusProvider>
      <Router>
        <Navbar user={user} userInfo={userInfo} />
        <div style={{ paddingTop: 80, minHeight: '100vh' }}>
          <Routes>
            <Route path="/login" element={!user ? <PhonePasswordAuth /> : <Navigate to="/" />} />
            <Route path="/fcm-test" element={user ? <FCMTest /> : <Navigate to="/login" />} />
            <Route path="/appointment-debugger" element={user ? <AppointmentDebugger /> : <Navigate to="/login" />} />
            <Route
              path="/"
              element={
                user ? (
                  user.role === 'admin' ? (
                    <AdminDashboard />
                  ) : user.role === 'doctor' ? (
                    <DoctorDashboard />
                  ) : (
                    <PatientDashboard />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </div>
        {user && <FCMRegistration />}
        {user && <FCMNotification />}
      </Router>
    </StatusProvider>
  );
}

export default App;
