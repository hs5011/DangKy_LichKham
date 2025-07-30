# Hướng dẫn Setup Firebase Cloud Messaging (FCM)

## 1. Cấu hình Firebase Console

### Bước 1: Tạo VAPID Key
1. Vào Firebase Console > Project Settings
2. Chọn tab "Cloud Messaging"
3. Tạo Web Push certificates (VAPID key)
4. Copy VAPID key và thay thế trong file `src/services/fcmService.js`:
   ```javascript
   vapidKey: 'YOUR_VAPID_KEY_HERE' // Thay thế bằng VAPID key thực
   ```

### Bước 2: Cấu hình Service Worker
Service worker đã được tạo tại `public/firebase-messaging-sw.js` với cấu hình Firebase của bạn.

## 2. Deploy Cloud Functions

### Bước 1: Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
```

### Bước 2: Login và init Firebase
```bash
firebase login
firebase init functions
```

### Bước 3: Deploy Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

## 3. Cấu hình Security Rules

### Firestore Rules
Thêm rules cho collection `fcm_tokens`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // FCM tokens collection
    match /fcm_tokens/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.email_verified == true || 
         get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin');
    }
  }
}
```

## 4. Testing FCM

### Bước 1: Đăng ký token
1. Đăng nhập vào ứng dụng
2. Cho phép thông báo trong trình duyệt
3. Token sẽ được lưu vào Firestore collection `fcm_tokens`

### Bước 2: Gửi thông báo test
1. Vào trang Admin > Gửi thông báo
2. Tạo thông báo test
3. Kiểm tra thông báo push

## 5. Troubleshooting

### Lỗi thường gặp:

1. **"User không có FCM token"**
   - Kiểm tra user đã cho phép thông báo chưa
   - Kiểm tra VAPID key có đúng không

2. **"Lỗi gửi thông báo"**
   - Kiểm tra Cloud Functions đã deploy chưa
   - Kiểm tra URL Cloud Functions có đúng không

3. **Thông báo không hiển thị**
   - Kiểm tra service worker đã load chưa
   - Kiểm tra console có lỗi gì không

### Debug:
1. Mở Developer Tools > Application > Service Workers
2. Kiểm tra service worker đã register chưa
3. Kiểm tra Console có lỗi gì không

## 6. Tính năng đã implement:

- ✅ Đăng ký FCM token tự động khi user đăng nhập
- ✅ Gửi thông báo cho bệnh nhân cụ thể
- ✅ Gửi thông báo cho tất cả bệnh nhân
- ✅ Hiển thị thông báo khi app đang mở
- ✅ Hiển thị thông báo khi app đang background
- ✅ Lưu lịch sử thông báo vào Firestore
- ✅ Cloud Functions để gửi thông báo
- ✅ Service Worker để xử lý background messages

## 7. Cấu trúc Database:

### Collection: `fcm_tokens`
```javascript
{
  userId: "user@email.com",
  token: "fcm_token_string",
  createdAt: timestamp,
  platform: "web",
  userType: "patient" // hoặc "admin", "doctor"
}
```

### Collection: `notifications`
```javascript
{
  title: "Tiêu đề thông báo",
  content: "Nội dung thông báo",
  type: "all" | "specific",
  targetPatient: "user@email.com", // nếu type = specific
  patientId: "user@email.com", // user nhận thông báo
  read: false,
  createdAt: timestamp,
  status: "sent" | "sending" | "error"
}
``` 