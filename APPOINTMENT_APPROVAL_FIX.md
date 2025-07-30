# Sửa lỗi Duyệt Lịch Khám

## Vấn đề đã được khắc phục:

### ❌ **Vấn đề cũ:**
1. Khi admin duyệt lịch khám, hệ thống chỉ duyệt một buổi khám cụ thể
2. Không duyệt tất cả các buổi trong phác đồ điều trị
3. Hệ thống không cập nhật UI sau khi duyệt
4. Không có thông báo rõ ràng về việc duyệt tất cả các buổi

### ✅ **Giải pháp mới:**

#### 1. **Duyệt tất cả các buổi trong phác đồ**
- Khi admin duyệt một buổi khám, hệ thống sẽ tự động duyệt tất cả các buổi khám có cùng `treatmentPlanId`
- Cập nhật status của `treatment_plan` thành `approved`
- Cập nhật status của tất cả `appointments` trong phác đồ thành `approved`

#### 2. **Từ chối tất cả lịch khám của bệnh nhân**
- Khi admin từ chối một buổi khám, hệ thống sẽ tự động từ chối TẤT CẢ các lịch khám của bệnh nhân đó
- Cập nhật status của tất cả `appointments` của bệnh nhân thành `cancelled`
- Cập nhật status của tất cả `treatment_plans` của bệnh nhân thành `cancelled`

#### 3. **Cập nhật UI tự động**
- Thêm `window.location.reload()` sau khi duyệt/từ chối
- Đảm bảo UI được cập nhật ngay lập tức

#### 4. **Thông báo rõ ràng**
- Modal xác nhận hiển thị cảnh báo về việc duyệt/từ chối tất cả các buổi
- Hiển thị số lượng buổi khám sẽ bị ảnh hưởng
- Hiển thị tên phác đồ điều trị

#### 5. **Ẩn nút thông minh**
- Khi trạng thái là "đã duyệt" (approved): chỉ ẩn nút "Duyệt", giữ nút "Từ chối"
- Khi trạng thái là "đã từ chối" (cancelled): chỉ ẩn nút "Từ chối", giữ nút "Duyệt"
- Khi trạng thái là "chờ duyệt" (pending): hiển thị cả hai nút
- Không hiển thị text trạng thái vì đã có ở cột trạng thái

## Code đã được sửa:

### 1. **Hàm `handleApprove`** - `ApproveAppointments.js`
```javascript
const handleApprove = async (id, planId) => {
  setActionMsg("");
  const approvedStatus = statuses.find(s => s.code === 'approved');
  if (!approvedStatus) throw new Error("Không tìm thấy trạng thái approved!");
  
  try {
    // Duyệt appointment cụ thể
    await updateDoc(doc(db, "appointments", id), { status: approvedStatus.code });
    
    // Nếu có treatment plan, duyệt tất cả appointments trong plan đó
    if (planId) {
      // Cập nhật treatment plan status
      await updateDoc(doc(db, "treatment_plans", planId), { status: approvedStatus.code });
      
      // Duyệt tất cả appointments có cùng treatmentPlanId
      const appointmentsToUpdate = allAppointments.filter(ap => ap.treatmentPlanId === planId);
      for (const appointment of appointmentsToUpdate) {
        await updateDoc(doc(db, "appointments", appointment.id), { status: approvedStatus.code });
      }
    }
    
    setActionMsg("Đã duyệt lịch khám và tất cả các buổi trong phác đồ!");
    
    // Refresh dữ liệu sau khi duyệt
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.error('Error approving appointment:', error);
    setActionMsg("Lỗi khi duyệt lịch khám: " + error.message);
  }
};
```

### 2. **Hàm `handleReject`** - `ApproveAppointments.js`
```javascript
const handleReject = async (id, reason) => {
  setActionMsg("");
  const cancelledStatus = statuses.find(s => s.code === 'cancelled');
  if (!cancelledStatus) throw new Error("Không tìm thấy trạng thái cancelled!");
  
  try {
    // Tìm appointment cụ thể
    const appointment = allAppointments.find(ap => ap.id === id);
    if (!appointment) throw new Error("Không tìm thấy appointment!");
    
    // Từ chối appointment cụ thể
    await updateDoc(doc(db, "appointments", id), { status: cancelledStatus.code, adminNote: reason });
    
    // Từ chối tất cả appointments của bệnh nhân này
    const patientAppointments = allAppointments.filter(ap => ap.patientId === appointment.patientId);
    for (const ap of patientAppointments) {
      await updateDoc(doc(db, "appointments", ap.id), { 
        status: cancelledStatus.code, 
        adminNote: reason 
      });
    }
    
    // Cập nhật tất cả treatment plans của bệnh nhân này
    const patientTreatmentPlans = new Set();
    patientAppointments.forEach(ap => {
      if (ap.treatmentPlanId) {
        patientTreatmentPlans.add(ap.treatmentPlanId);
      }
    });
    
    for (const planId of patientTreatmentPlans) {
      await updateDoc(doc(db, "treatment_plans", planId), { 
        status: cancelledStatus.code, 
        adminNote: reason 
      });
    }
    
    setActionMsg("Đã từ chối tất cả lịch khám của bệnh nhân!");
    
    // Refresh dữ liệu sau khi từ chối
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    setActionMsg("Lỗi khi từ chối lịch khám: " + error.message);
  }
};
```

### 3. **Modal xác nhận cập nhật**
- Thêm cảnh báo về việc duyệt/từ chối tất cả các buổi
- Hiển thị số lượng buổi khám sẽ bị ảnh hưởng
- Hiển thị tên phác đồ điều trị

### 4. **Ẩn nút khi đã duyệt** - `ApproveAppointments.js`
```javascript
{(a.plan.status || a.status) !== 'approved' && (
  <button style={{ ...styles.btn, ...styles.approve }} onClick={() => setConfirmAction({type: 'approve', a})}>Duyệt</button>
)}
{(a.plan.status || a.status) !== 'cancelled' && (
  <button style={{ ...styles.btn, ...styles.reject }} onClick={() => setConfirmAction({type: 'reject', a})}>Từ chối</button>
)}
```

## Cách hoạt động:

### 1. **Khi admin duyệt lịch khám:**
1. Admin click "Duyệt" trên một buổi khám
2. Modal hiển thị cảnh báo về việc duyệt tất cả các buổi
3. Admin xác nhận
4. Hệ thống duyệt appointment cụ thể
5. Nếu có treatment plan, duyệt tất cả appointments trong plan
6. Cập nhật treatment plan status
7. Hiển thị thông báo thành công
8. Refresh trang sau 1.5 giây

### 2. **Khi admin từ chối lịch khám:**
1. Admin click "Từ chối" trên một buổi khám
2. Modal hiển thị cảnh báo: "⚠️ Lưu ý: Hành động này sẽ từ chối TẤT CẢ các lịch khám của bệnh nhân này!"
3. Admin nhập lý do và xác nhận
4. Hệ thống từ chối appointment cụ thể
5. **Từ chối TẤT CẢ appointments của bệnh nhân**
6. **Cập nhật TẤT CẢ treatment plans của bệnh nhân**
7. Hiển thị thông báo: "Đã từ chối tất cả lịch khám của bệnh nhân!"
8. Refresh trang sau 1.5 giây

### 3. **Hiển thị nút thông minh:**
- **Chờ duyệt (pending)**: Hiển thị cả nút "Duyệt" và "Từ chối"
- **Đã duyệt (approved)**: Chỉ hiển thị nút "Từ chối" (để có thể từ chối nếu cần)
- **Đã từ chối (cancelled)**: Chỉ hiển thị nút "Duyệt" (để có thể duyệt lại nếu cần)

## Lợi ích:

### ✅ **Tính nhất quán**
- Tất cả các buổi trong phác đồ được duyệt/từ chối cùng lúc
- Tránh tình trạng một số buổi được duyệt, một số không

### ✅ **Hiệu quả**
- Admin chỉ cần duyệt một lần cho toàn bộ phác đồ
- Tiết kiệm thời gian và công sức

### ✅ **Minh bạch**
- Modal hiển thị rõ ràng về việc sẽ duyệt/từ chối tất cả các buổi
- Admin biết chính xác những gì sẽ xảy ra

### ✅ **Cập nhật real-time**
- UI được refresh ngay lập tức sau khi duyệt/từ chối
- Đảm bảo dữ liệu hiển thị chính xác

## Test Cases:

### Test 1: Duyệt phác đồ điều trị
1. Tạo phác đồ điều trị với 5 buổi khám
2. Admin duyệt một buổi khám
3. Kiểm tra tất cả 5 buổi khám đều được duyệt
4. Kiểm tra treatment plan status = approved

### Test 2: Từ chối phác đồ điều trị
1. Tạo phác đồ điều trị với 3 buổi khám
2. Admin từ chối một buổi khám với lý do
3. Kiểm tra tất cả 3 buổi khám đều bị từ chối
4. Kiểm tra treatment plan status = cancelled
5. Kiểm tra adminNote được lưu

### Test 2: Từ chối tất cả lịch khám của bệnh nhân
1. Bệnh nhân có nhiều lịch khám khác nhau (phác đồ A, phác đồ B, lịch riêng lẻ)
2. Admin từ chối một buổi khám với lý do
3. Kiểm tra TẤT CẢ lịch khám của bệnh nhân đều bị từ chối
4. Kiểm tra TẤT CẢ treatment plans của bệnh nhân status = cancelled
5. Kiểm tra adminNote được lưu cho tất cả appointments

### Test 3: Cập nhật UI
1. Duyệt/từ chối lịch khám
2. Kiểm tra trang được refresh sau 1.5 giây
3. Kiểm tra dữ liệu hiển thị chính xác

### Test 4: Modal cảnh báo
1. Click duyệt/từ chối
2. Kiểm tra modal hiển thị cảnh báo
3. Kiểm tra hiển thị số lượng buổi khám
4. Kiểm tra hiển thị tên phác đồ

### Test 5: Ẩn nút khi đã duyệt
1. Duyệt một lịch khám
2. Kiểm tra nút "Duyệt" và "Từ chối" biến mất
3. Kiểm tra hiển thị text "Đã duyệt"
4. Kiểm tra nút "Xem chi tiết" vẫn còn
5. Từ chối một lịch khám khác
6. Kiểm tra hiển thị text "Đã từ chối"

### Test 5: Ẩn nút thông minh
1. **Lịch chờ duyệt (pending)**:
   - Kiểm tra hiển thị cả nút "Duyệt" và "Từ chối"
2. **Lịch đã duyệt (approved)**:
   - Kiểm tra chỉ hiển thị nút "Từ chối"
   - Kiểm tra nút "Duyệt" đã ẩn
3. **Lịch đã từ chối (cancelled)**:
   - Kiểm tra chỉ hiển thị nút "Duyệt"
   - Kiểm tra nút "Từ chối" đã ẩn
4. **Nút "Xem chi tiết"**:
   - Kiểm tra luôn hiển thị ở mọi trạng thái 