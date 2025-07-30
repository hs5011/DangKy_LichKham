# Hướng dẫn khắc phục lỗi FCM Notification

## Vấn đề đã được phát hiện và sửa:

### 1. VAPID Key chưa được cấu hình đúng
- **Vấn đề**: Trong `fcmService.js`, VAPID key được set là placeholder
- **Giải pháp**: Đã cập nhật VAPID key thực tế

### 2. Logic gửi thông báo có vấn đề
- **Vấn đề**: Tạo nhiều document không cần thiết trong collection `notifications`
- **Giải pháp**: Tách riêng thông báo cho bệnh nhân vào collection `patient_notifications`

### 3. Cloud Function cần được deploy
- **Vấn đề**: Cloud Functions có thể chưa được deploy
- **Giải pháp**: Cần deploy Cloud Functions theo hướng dẫn

## Các bước khắc phục:

### Bước 1: Deploy Cloud Functions
```bash
# Cài đặt Firebase CLI
npm install -g firebase-tools

# Đăng nhập Firebase
firebase login

# Deploy functions
cd functions
npm install
firebase deploy --only functions
```

### Bước 2: Kiểm tra cấu hình Firebase
1. Vào Firebase Console
2. Kiểm tra Cloud Functions đã được deploy
3. Kiểm tra Firestore Rules cho phép đọc/ghi
4. Kiểm tra FCM đã được bật

### Bước 3: Test FCM
1. Đăng nhập với tài khoản bệnh nhân
2. Cho phép thông báo trong trình duyệt
3. Kiểm tra FCM token đã được đăng ký
4. Gửi thông báo test từ admin

### Bước 4: Debug nếu cần
1. Kiểm tra Console logs
2. Kiểm tra Firebase Functions logs
3. Kiểm tra Network tab trong DevTools

## Cấu trúc dữ liệu mới:

### Collection: `notifications` (cho admin)
```javascript
{
  title: "Tiêu đề thông báo",
  content: "Nội dung thông báo",
  type: "all" | "specific",
  targetPatient: "email@example.com", // nếu type = specific
  status: "sending" | "sent" | "error",
  createdAt: timestamp
}
```

### Collection: `patient_notifications` (cho bệnh nhân)
```javascript
{
  title: "Tiêu đề thông báo",
  content: "Nội dung thông báo",
  patientId: "email@example.com",
  read: false,
  createdAt: timestamp,
  notificationId: "id_from_notifications_collection"
}
```

### Collection: `fcm_tokens`
```javascript
{
  token: "fcm_token_string",
  userId: "email@example.com",
  userType: "patient",
  createdAt: timestamp,
  platform: "web"
}
```

## Lưu ý quan trọng:

1. **VAPID Key**: Đảm bảo VAPID key đúng trong Firebase Console
2. **Service Worker**: File `firebase-messaging-sw.js` phải ở thư mục `public`
3. **Permissions**: Người dùng phải cho phép thông báo
4. **HTTPS**: FCM chỉ hoạt động trên HTTPS (trừ localhost)

## Test Cases:

### Test 1: Đăng ký FCM
- Đăng nhập bệnh nhân
- Kiểm tra FCM token được tạo trong Firestore

### Test 2: Gửi thông báo
- Admin gửi thông báo
- Kiểm tra Cloud Function logs
- Kiểm tra thông báo hiển thị cho bệnh nhân

### Test 3: Background notification
- Đóng tab trình duyệt
- Admin gửi thông báo
- Kiểm tra thông báo hiển thị

## Troubleshooting:

### Lỗi "No FCM token found"
- Kiểm tra user đã đăng ký FCM chưa
- Kiểm tra permission thông báo
- Kiểm tra VAPID key

### Lỗi "Cloud Function not found"
- Deploy lại Cloud Functions
- Kiểm tra project ID
- Kiểm tra billing

### Lỗi "Permission denied"
- Kiểm tra Firestore Rules
- Kiểm tra IAM permissions 