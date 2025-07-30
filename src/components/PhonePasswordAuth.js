import React, { useState } from "react";
import { auth, db } from "../services/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function phoneToEmail(phone) {
  // Chuyển số điện thoại thành email giả lập
  return `${phone.replace("+", "")}@yourapp.com`;
}

// Danh sách mẫu các phường/xã (có thể mở rộng hoặc lấy từ Firestore sau)
const WARDS = [
  "Phường Bình Thạnh",
  "Phường An Khánh",
  "Phường Xuân Hoà",
  "Phường 1",
  "Phường 2",
  "Phường 3"
];

// Regex kiểm tra số điện thoại Việt Nam (bắt đầu bằng 0 hoặc +84, 10 số)
const phoneRegex = /^(\+84|0)[0-9]{9}$/;

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '32px 36px',
    minWidth: 370,
    maxWidth: 95,
    textAlign: 'center',
  },
  formRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 150,
    marginBottom: 0,
  },
  label: {
    fontWeight: 500,
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    outline: 'none',
    marginBottom: 0,
    background: '#f7fafd',
    transition: 'border 0.2s',
  },
  select: {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #bfc9d9',
    fontSize: 15,
    background: '#f7fafd',
    outline: 'none',
    marginBottom: 0,
  },
  button: {
    marginTop: 18,
    padding: '10px 28px',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(90deg, #4f8cff 0%, #3358e6 100%)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(79,140,255,0.12)',
    transition: 'background 0.2s',
  },
  switchBtn: {
    marginTop: 14,
    background: 'none',
    border: 'none',
    color: '#3358e6',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: 15,
    textDecoration: 'underline',
  },
  error: {
    color: '#e53935',
    marginTop: 10,
    fontWeight: 500,
  },
  title: {
    fontWeight: 700,
    fontSize: 24,
    marginBottom: 24,
    color: '#22336b',
    letterSpacing: 0.5,
  },
};

function PhonePasswordAuth() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [ward, setWard] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneRegex.test(phone)) {
      setMessage("Vui lòng nhập số điện thoại hợp lệ (bắt đầu bằng 0 hoặc +84, đủ 10 số).");
      return;
    }
    const email = phoneToEmail(phone);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Đăng nhập thành công!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Lưu thông tin bệnh nhân vào Firestore
        await setDoc(doc(db, "users", email), {
          phone,
          fullName,
          ward
        });
        setMessage("Đăng ký thành công!");
      }
    } catch (error) {
      // Hiển thị lỗi tiếng Việt thân thiện hơn
      let msg = error.message;
      if (error.code === "auth/email-already-in-use") {
        msg = "Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng số khác.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Số điện thoại không hợp lệ.";
      } else if (error.code === "auth/wrong-password") {
        msg = "Mật khẩu không đúng.";
      } else if (error.code === "auth/user-not-found") {
        msg = "Không tìm thấy tài khoản với số điện thoại này.";
      }
      setMessage(msg);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>{isLogin ? "Đăng nhập" : "Đăng ký"} bằng Số điện thoại & Mật khẩu</div>
        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="phone" style={styles.label}>Số điện thoại:</label>
              <input
                id="phone"
                type="tel"
                style={styles.input}
                placeholder="Nhập số điện thoại (+84 hoặc 0...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                required
                maxLength={13}
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>Mật khẩu:</label>
              <input
                id="password"
                type="password"
                style={styles.input}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {!isLogin && (
              <>
                <div style={styles.formGroup}>
                  <label htmlFor="fullName" style={styles.label}>Họ và tên:</label>
                  <input
                    id="fullName"
                    type="text"
                    style={styles.input}
                    placeholder="Họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="ward" style={styles.label}>Phường/Xã:</label>
                  <select
                    id="ward"
                    style={styles.select}
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    required
                  >
                    <option value="">Chọn Phường/Xã</option>
                    {WARDS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          <button type="submit" style={styles.button}>{isLogin ? "Đăng nhập" : "Đăng ký"}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
          {isLogin ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
        {message && <div style={styles.error}>{message}</div>}
      </div>
    </div>
  );
}

export default PhonePasswordAuth; 