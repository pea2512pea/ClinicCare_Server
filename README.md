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


