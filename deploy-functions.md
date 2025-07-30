# Hướng dẫn Deploy Cloud Functions

## Bước 1: Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
```

## Bước 2: Đăng nhập Firebase
```bash
firebase login
```

## Bước 3: Deploy Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

## Bước 4: Kiểm tra logs
```bash
firebase functions:log
```

## Lưu ý quan trọng:
1. Đảm bảo đã cấu hình đúng project ID trong firebase.json
2. Kiểm tra quyền truy cập Firestore trong Firebase Console
3. Đảm bảo đã bật Cloud Functions trong Firebase Console 