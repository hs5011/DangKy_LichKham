import React from "react";
import { auth } from "../services/firebase";

const styles = {
  navbar: {
    width: '100%',
    background: 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)',
    color: '#fff',
    padding: '12px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(79,140,255,0.12)',
    minHeight: '60px',
    boxSizing: 'border-box',
  },
  brand: {
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: 1,
    flexShrink: 0,
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  user: {
    fontWeight: 500,
    fontSize: 16,
    whiteSpace: 'nowrap',
  },
  btn: {
    background: '#fff',
    color: '#3358e6',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    minWidth: '90px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  btnHover: {
    background: '#f8f9fa',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
};

function Navbar({ user, userInfo }) {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.brand}>QUẢN LÝ LỊCH KHÁM BỆNH</div>
      <div style={styles.userSection}>
        {user ? (
          <>
            <span style={styles.user}>
              Xin chào{userInfo && userInfo.fullName ? `, ${userInfo.fullName}` : ''}
            </span>
            <button 
              style={styles.btn} 
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8f9fa';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <button 
            style={styles.btn} 
            onClick={() => window.location.reload()}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8f9fa';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#fff';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </div>
  );
}

export default Navbar; 