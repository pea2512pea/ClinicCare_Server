# Clinic Care – ระบบจัดการคลินิกและการนัดหมายผู้ป่วย
## Clinic Care เป็นเว็บแอปสำหรับจัดการข้อมูลผู้ป่วย แพทย์ การนัดหมาย และบริการรักษา พร้อมระบบรายงานสรุปการให้บริการของคลินิกในแต่ละช่วงเวลา

รายชื่อตาราง 4
ตารางพร้อมคอลัมน์หลัก
1) Patients
-id (PK)
-citizen_id
-first_name
-last_name
-phone
-email

2) Doctors
-id (PK)
-full_name
-specialty
-phone
-email

3) Appointments
-id (PK)
-appointment_date
-start_time
-status
-patient_id (FK)
-doctor_id (FK)

4) Services
-id (PK)
-service_name
-price

5) AppointmentServices (Junction Table)
-id (PK)
-appointment_id (FK)
-service_id (FK)
     
อธิบายความสัมพันธ์ระหว่างตาราง
(Relationships)
Patients 1 คน สามารถมี Appointments ได้หลายรายการ (One-to-Many)
Doctors 1 คน สามารถมี Appointments ได้หลายรายการ (One-to-Many)
Appointments และ Services มีความสัมพันธ์แบบ Many-to-Many ผ่านตาราง AppointmentServices
AppointmentServices ทำหน้าที่เป็น Junction Table สำหรับเชื่อมข้อมูลระหว่างสองตาราง

# วิธีการติดตั้งและรันโปรแกรม (Installation & Setup)
## สิ่งที่ต้องมี
- Node.js, Git
## วิธีการติดตั้งและรันโปรแกรม
### 1. โคลน Repository ลงบนเครื่อง (Clone the repository)
### 2. เพิ่มไฟล์ .env ให้มี environment เหมือน .env.example โดยมี client_url ให้ตรงกับ url ของ Frontend
เปิด Terminal และติดตั้งไลบรารีที่จำเป็น
```bash
npm install
```
เริ่มการทำงานของเซิร์ฟเวอร์หลังบ้าน
```bash
npm run dev || npm run start
```
### การเข้าใช้งานระบบ
เมื่อรันทั้ง Frontend และ Backend สำเร็จแล้ว สามารถเข้าใช้งานเว็บแอปพลิเคชันผ่านเว็บบราวเซอร์ได้ที่:
- หน้าเว็บไซต์หลัก: http://localhost:(PORT ตาม env)


