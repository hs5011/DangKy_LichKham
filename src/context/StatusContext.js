import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const StatusContext = createContext();

export const useStatus = () => {
  return useContext(StatusContext);
};

export const StatusProvider = ({ children }) => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const snap = await getDocs(collection(db, 'status_catalog'));
        const statusMap = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setStatuses(statusMap);
      } catch (error) {
        console.error("Error fetching status catalog:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatuses();
  }, []);

  const getStatusLabel = (code) => {
    if (loading) return 'Đang tải...';
    const status = statuses.find(s => s.code === code);
    return status ? status.label : code;
  };

  const value = {
    statuses,
    getStatusLabel,
    loading,
  };

  return (
    <StatusContext.Provider value={value}>
      {children}
    </StatusContext.Provider>
  );
}; 