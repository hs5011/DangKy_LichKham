# Chức năng Quản lý Lịch khám - Bác sĩ

## Tổng quan

Chức năng này cho phép bác sĩ quản lý lịch khám của bệnh nhân đã được duyệt, cập nhật trạng thái khám và gọi số đến lượt khám.

## Tính năng chính

### 1. **Xem danh sách lịch khám**
- Hiển thị tất cả lịch khám đã được admin duyệt
- Lọc theo ngày khám
- Lọc theo trạng thái (Chờ khám, Đang khám, Đã khám, Đã hủy)
- Lọc theo phòng khám
- Sắp xếp theo thứ tự ngày khám

### 2. **Cập nhật trạng thái lịch khám**
- **Chờ khám** → **Đang khám**: Khi bệnh nhân đến và bắt đầu khám
- **Đang khám** → **Đã khám**: Khi hoàn thành buổi khám
- **Đã hủy**: Khi cần hủy lịch khám

### 3. **Gọi số đến lượt khám**
- Hiển thị thông tin chi tiết bệnh nhân
- Thông tin liên hệ, triệu chứng, ghi chú
- Lịch sử khám bệnh

## Cách sử dụng

### **Đăng nhập với tài khoản bác sĩ**
1. Đăng nhập với email có role = 'doctor'
2. Hệ thống sẽ chuyển đến giao diện bác sĩ
3. Menu "Quản lý lịch khám" sẽ hiển thị

### **Xem danh sách lịch khám**
1. Chọn ngày khám từ date picker
2. Lọc theo trạng thái nếu cần
3. Lọc theo phòng khám nếu cần
4. Danh sách sẽ hiển thị các lịch khám phù hợp

### **Cập nhật trạng thái**
1. **Bắt đầu khám**: Click nút "Bắt đầu khám" khi bệnh nhân đến
2. **Hoàn thành**: Click nút "Hoàn thành" khi khám xong
3. Trạng thái sẽ được cập nhật ngay lập tức

### **Gọi số bệnh nhân**
1. Click nút "Gọi số" bên cạnh lịch khám
2. Modal hiển thị thông tin chi tiết bệnh nhân
3. Bác sĩ có thể xem thông tin và gọi bệnh nhân

## Cấu trúc dữ liệu

### **Appointments Collection**
```javascript
{
  id: "appointment_id",
  patientId: "patient_email",
  clinicId: "clinic_id",
  timeSlotId: "slot_id",
  date: "2024-01-01",
  status: "approved" | "waiting" | "in_progress" | "completed" | "cancelled",
  symptoms: "Triệu chứng",
  note: "Ghi chú",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **Users Collection**
```javascript
{
  email: "patient@example.com",
  fullName: "Họ tên bệnh nhân",
  phone: "0901234567",
  ward: "Phường/Xã",
  role: "patient"
}
```

### **Clinics Collection**
```javascript
{
  id: "clinic_id",
  name: "Tên phòng khám",
  description: "Mô tả"
}
```

### **Time Slots Collection**
```javascript
{
  id: "slot_id",
  startTime: "08:00",
  endTime: "09:00",
  description: "Mô tả"
}
```

## Trạng thái lịch khám

### **approved**
- Lịch khám đã được admin duyệt
- Bệnh nhân chưa đến khám
- Hiển thị nút "Bắt đầu khám"

### **waiting**
- Bệnh nhân đã đến, chờ khám
- Hiển thị nút "Bắt đầu khám"

### **in_progress**
- Bệnh nhân đang được khám
- Hiển thị nút "Hoàn thành"

### **completed**
- Buổi khám đã hoàn thành
- Không hiển thị nút thao tác

### **cancelled**
- Lịch khám đã bị hủy
- Không hiển thị nút thao tác

## Giao diện

### **Header**
- Tiêu đề "Quản lý lịch khám - Bác sĩ"
- Date picker để chọn ngày khám

### **Filter Box**
- Dropdown lọc theo trạng thái
- Dropdown lọc theo phòng khám

### **Table**
- STT
- Họ tên bệnh nhân
- SĐT
- Ngày khám
- Giờ khám
- Phòng khám
- Trạng thái (badge màu)
- Thao tác (các nút)

### **Modal chi tiết**
- Thông tin đầy đủ bệnh nhân
- Thông tin lịch khám
- Triệu chứng và ghi chú

## Lợi ích

### **Hiệu quả**
- Quản lý lịch khám theo thời gian thực
- Cập nhật trạng thái nhanh chóng
- Gọi số bệnh nhân dễ dàng

### **Minh bạch**
- Hiển thị rõ ràng trạng thái từng lịch khám
- Thông tin chi tiết bệnh nhân
- Lịch sử cập nhật

### **Tiện lợi**
- Giao diện thân thiện
- Thao tác đơn giản
- Responsive design

## Test Cases

### Test 1: Xem danh sách lịch khám
1. Đăng nhập với tài khoản bác sĩ
2. Chọn ngày khám
3. Kiểm tra danh sách hiển thị đúng
4. Kiểm tra thông tin bệnh nhân

### Test 2: Cập nhật trạng thái
1. Click "Bắt đầu khám"
2. Kiểm tra trạng thái chuyển thành "Đang khám"
3. Click "Hoàn thành"
4. Kiểm tra trạng thái chuyển thành "Đã khám"

### Test 3: Gọi số bệnh nhân
1. Click "Gọi số"
2. Kiểm tra modal hiển thị thông tin
3. Kiểm tra thông tin đầy đủ

### Test 4: Lọc dữ liệu
1. Chọn trạng thái khác nhau
2. Chọn phòng khám khác nhau
3. Kiểm tra danh sách được lọc đúng

## Lưu ý quan trọng

1. **Chỉ hiển thị lịch đã duyệt**: Chỉ những lịch khám có status = 'approved' mới hiển thị
2. **Cập nhật real-time**: Trạng thái được cập nhật ngay lập tức
3. **Backup dữ liệu**: Mọi thay đổi đều được lưu vào Firestore
4. **Bảo mật**: Chỉ bác sĩ mới có quyền truy cập
5. **Logging**: Mọi thao tác đều được ghi log để theo dõi 