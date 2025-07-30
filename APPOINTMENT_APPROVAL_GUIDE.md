# Hướng dẫn Duyệt Lịch Khám

## Vấn đề đã được khắc phục:

### ❌ Vấn đề cũ:
- Khi admin duyệt lịch khám, hệ thống duyệt tất cả các buổi trong phác đồ điều trị
- Điều này gây ra việc duyệt không chính xác và khó kiểm soát

### ✅ Giải pháp mới:
- Tách riêng hai cách duyệt: duyệt phác đồ và duyệt từng buổi khám
- Cho phép admin kiểm soát chi tiết hơn

## Hai cách duyệt lịch khám:

### 1. Duyệt lịch khám (Phác đồ) - `ApproveAppointments.js`
- **Mục đích**: Duyệt toàn bộ phác đồ điều trị
- **Đối tượng**: Treatment plans
- **Khi nào sử dụng**: 
  - Khi bệnh nhân đăng ký phác đồ điều trị mới
  - Admin muốn duyệt toàn bộ lịch trình điều trị
  - Phù hợp cho các phác đồ điều trị dài hạn

### 2. Duyệt từng buổi khám - `ApproveIndividualAppointments.js`
- **Mục đích**: Duyệt từng buổi khám riêng biệt
- **Đối tượng**: Individual appointments
- **Khi nào sử dụng**:
  - Khi cần duyệt từng buổi khám cụ thể
  - Khi có thay đổi lịch trình
  - Khi cần kiểm soát chi tiết từng buổi khám
  - Phù hợp cho việc quản lý linh hoạt

## Cách sử dụng:

### Duyệt phác đồ:
1. Vào menu "Duyệt lịch khám (Phác đồ)"
2. Xem danh sách các phác đồ điều trị chờ duyệt
3. Click "Xem chi tiết" để xem tất cả các buổi trong phác đồ
4. Click "Duyệt" để duyệt toàn bộ phác đồ

### Duyệt từng buổi khám:
1. Vào menu "Duyệt từng buổi khám"
2. Xem danh sách các buổi khám chờ duyệt
3. Click "Chi tiết" để xem thông tin buổi khám cụ thể
4. Click "Duyệt" để duyệt buổi khám đó

## Lợi ích của giải pháp mới:

### ✅ Kiểm soát chi tiết
- Admin có thể duyệt từng buổi khám riêng biệt
- Tránh duyệt nhầm các buổi không mong muốn

### ✅ Linh hoạt trong quản lý
- Có thể duyệt phác đồ hoặc từng buổi tùy tình huống
- Dễ dàng điều chỉnh lịch trình

### ✅ Minh bạch
- Rõ ràng về việc duyệt gì và khi nào
- Dễ dàng theo dõi và kiểm tra

## Cấu trúc dữ liệu:

### Treatment Plans (Phác đồ)
```javascript
{
  id: "plan_id",
  patientId: "patient_email",
  protocolId: "protocol_id",
  status: "pending" | "approved" | "cancelled",
  startDate: "2024-01-01",
  days: 10,
  createdAt: timestamp
}
```

### Individual Appointments (Từng buổi khám)
```javascript
{
  id: "appointment_id",
  patientId: "patient_email",
  treatmentPlanId: "plan_id", // optional
  clinicId: "clinic_id",
  timeSlotId: "slot_id",
  date: "2024-01-01",
  status: "pending" | "approved" | "cancelled" | "completed",
  symptoms: "Triệu chứng",
  note: "Ghi chú",
  createdAt: timestamp
}
```

## Lưu ý quan trọng:

1. **Không duyệt treatment plan**: Đã sửa để không tự động duyệt treatment plan khi duyệt appointment
2. **Kiểm tra kỹ**: Luôn xem chi tiết trước khi duyệt
3. **Ghi chú**: Sử dụng ghi chú để giải thích lý do từ chối
4. **Theo dõi**: Kiểm tra logs để đảm bảo duyệt đúng

## Test Cases:

### Test 1: Duyệt phác đồ
- Đăng ký phác đồ điều trị mới
- Admin duyệt phác đồ
- Kiểm tra tất cả appointments được tạo với status approved

### Test 2: Duyệt từng buổi
- Tạo appointment riêng lẻ
- Admin duyệt từng buổi
- Kiểm tra chỉ buổi đó được duyệt

### Test 3: Từ chối
- Admin từ chối buổi khám
- Kiểm tra status và ghi chú
- Kiểm tra thông báo cho bệnh nhân 