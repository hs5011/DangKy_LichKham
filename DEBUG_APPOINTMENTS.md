# Debug Appointments - Hướng dẫn khắc phục lỗi

## Vấn đề
Admin đã duyệt lịch khám nhưng bác sĩ không thấy lịch hiển thị.

## Cách debug

### 1. **Kiểm tra dữ liệu trong Firestore**
- Truy cập: `http://localhost:3000/appointment-debugger`
- Xem tổng quan appointments
- Kiểm tra status của từng appointment

### 2. **Kiểm tra Console Logs**
- Mở Developer Tools (F12)
- Xem tab Console
- Tìm các log messages:
  - "Total appointments found: X"
  - "Processing appointment: {...}"
  - "Fetched appointments: [...]"
  - "Filtered appointments: [...]"

### 3. **Các nguyên nhân có thể**

#### **A. Appointments chưa được duyệt**
- Status vẫn là "pending"
- Admin chưa click "Duyệt"
- Kiểm tra trong AdminDashboard

#### **B. Query không đúng**
- Component đang tìm `status = 'approved'`
- Nhưng appointments có thể có status khác
- Đã sửa thành `status in ['approved', 'waiting', 'in_progress', 'completed']`

#### **C. Date filter**
- Ngày được chọn không khớp với ngày appointment
- Thử xóa date filter

#### **D. Clinic filter**
- Phòng khám được chọn không khớp
- Thử xóa clinic filter

### 4. **Các bước kiểm tra**

#### **Bước 1: Kiểm tra dữ liệu**
1. Vào `/appointment-debugger`
2. Xem có appointments nào không
3. Kiểm tra status của từng appointment

#### **Bước 2: Kiểm tra Console**
1. Mở Developer Tools
2. Xem Console logs
3. Tìm thông báo lỗi

#### **Bước 3: Test không filter**
1. Vào giao diện bác sĩ
2. Click "Xóa bộ lọc"
3. Xem có hiển thị appointments không

#### **Bước 4: Kiểm tra Admin**
1. Vào AdminDashboard
2. Kiểm tra appointments có status "approved" không
3. Nếu chưa, duyệt appointments

### 5. **Các lỗi thường gặp**

#### **Lỗi 1: Không có appointments**
```
Total appointments found: 0
```
**Giải pháp**: Kiểm tra xem có appointments trong Firestore không

#### **Lỗi 2: Appointments không được duyệt**
```
Processing appointment: {status: "pending"}
```
**Giải pháp**: Admin cần duyệt appointments

#### **Lỗi 3: Date filter không khớp**
```
Selected date: 2024-01-01
Appointment date: 2024-01-02
```
**Giải pháp**: Chọn đúng ngày hoặc xóa date filter

#### **Lỗi 4: Clinic filter không khớp**
```
Filter clinic: clinic_1
Appointment clinic: clinic_2
```
**Giải pháp**: Chọn đúng clinic hoặc xóa clinic filter

### 6. **Test Cases**

#### **Test 1: Appointments đã duyệt**
1. Admin duyệt appointments
2. Bác sĩ vào giao diện
3. Kiểm tra hiển thị appointments

#### **Test 2: Không filter**
1. Xóa tất cả filter
2. Kiểm tra hiển thị tất cả appointments

#### **Test 3: Date filter**
1. Chọn ngày cụ thể
2. Kiểm tra chỉ hiển thị appointments ngày đó

#### **Test 4: Status filter**
1. Chọn status "approved"
2. Kiểm tra chỉ hiển thị appointments đã duyệt

### 7. **Logs cần kiểm tra**

```javascript
// Logs trong Console
console.log('Total appointments found:', snapshot.docs.length);
console.log('Processing appointment:', appointment);
console.log('Found user data:', appointment.user);
console.log('Found clinic data:', appointment.clinic);
console.log('Found slot data:', appointment.slot);
console.log('Fetched appointments:', appointmentsData);
console.log('Filtered appointments:', filteredAppointments);
console.log('Selected date:', selectedDate);
console.log('Filter status:', filterStatus);
console.log('Filter clinic:', filterClinic);
```

### 8. **Cấu trúc dữ liệu mong đợi**

```javascript
// Appointment object
{
  id: "appointment_id",
  patientId: "patient@email.com",
  clinicId: "clinic_id",
  timeSlotId: "slot_id",
  date: "2024-01-01",
  status: "approved", // hoặc "waiting", "in_progress", "completed"
  symptoms: "Triệu chứng",
  note: "Ghi chú",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 9. **Hướng dẫn sửa lỗi**

#### **Nếu không có appointments:**
1. Kiểm tra Firestore có dữ liệu không
2. Tạo appointments mới
3. Admin duyệt appointments

#### **Nếu appointments không hiển thị:**
1. Kiểm tra Console logs
2. Xóa tất cả filter
3. Kiểm tra date format

#### **Nếu filter không hoạt động:**
1. Kiểm tra logic filter
2. Kiểm tra data type
3. Test từng filter riêng lẻ

### 10. **Liên hệ hỗ trợ**

Nếu vẫn không khắc phục được, hãy cung cấp:
1. Screenshot Console logs
2. Screenshot dữ liệu từ `/appointment-debugger`
3. Mô tả chi tiết lỗi
4. Các bước đã thử 