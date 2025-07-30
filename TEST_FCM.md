# Hướng dẫn Test FCM Notification

## Bước 1: Test FCM Registration
1. Đăng nhập với tài khoản bệnh nhân
2. Truy cập: `http://localhost:3000/fcm-test`
3. Click "Đăng ký FCM"
4. Cho phép thông báo trong trình duyệt
5. Kiểm tra FCM token đã được tạo

## Bước 2: Test In-App Notification
1. Trong trang FCM Test
2. Click "Gửi thông báo test (In-app)"
3. Kiểm tra thông báo xuất hiện trong app
4. Kiểm tra tab "Thông báo" có thông báo mới

## Bước 3: Test FCM Direct (Tùy chọn)
1. Lấy Server Key từ Firebase Console
2. Thay thế `YOUR_SERVER_KEY` trong FCMTest.js
3. Click "Gửi FCM trực tiếp"
4. Kiểm tra thông báo push

## Bước 4: Test từ Admin
1. Đăng nhập với tài khoản admin
2. Vào trang "Gửi thông báo"
3. Gửi thông báo cho bệnh nhân cụ thể
4. Kiểm tra bệnh nhân nhận được thông báo

## Debug Checklist:

### ✅ FCM Registration
- [ ] User đã đăng nhập
- [ ] Permission thông báo được cho phép
- [ ] FCM token được tạo trong Firestore
- [ ] VAPID key đúng

### ✅ In-App Notification
- [ ] Thông báo hiển thị trong app
- [ ] Component FCMNotification hoạt động
- [ ] Thông báo được lưu trong patient_notifications

### ✅ Background Notification
- [ ] Service worker đã được đăng ký
- [ ] File firebase-messaging-sw.js tồn tại
- [ ] Thông báo hiển thị khi app đóng

## Lỗi thường gặp:

### "Permission denied"
- Kiểm tra user đã cho phép thông báo
- Refresh trang và thử lại

### "No FCM token found"
- Đăng ký lại FCM
- Kiểm tra console logs

### "Cloud Function not found"
- Deploy Cloud Functions
- Hoặc sử dụng test in-app trước

## Next Steps:
1. Test thành công in-app notification
2. Deploy Cloud Functions
3. Test background notification
4. Test từ admin dashboard 