/* ============================================================
   db-tool.js — Helper for Exporting SQLite DB from Browser
   วิธีใช้: เปิด Console ใน Browser แล้วพิมพ์ downloadDB()
   ============================================================ */
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);

export async function downloadDB() {
  try {
    console.log("⏳ กำลังเตรียมไฟล์ Database...");

    // 1. ตรวจสอบและรอ jeep-sqlite (สำหรับ Web)
    let jeep = document.querySelector('jeep-sqlite');
    if (!jeep) {
      jeep = document.createElement('jeep-sqlite');
      document.body.appendChild(jeep);
    }
    await customElements.whenDefined('jeep-sqlite');

    // 2. บันทึกสถานะล่าสุดจาก Memory ลง IndexedDB
    await sqlite.saveToStore('piggyplan_local');

    // 3. ดึงข้อมูลดิบจาก IndexedDB (ชื่อ DB มาตรฐานของ plugin คือ 'sqlite-web-store')
    const dbName = 'piggyplan_local';
    const request = indexedDB.open('sqlite-web-store');

    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // ตรวจสอบว่ามี objectStore ชื่อ 'databases' หรือไม่
      if (!db.objectStoreNames.contains('databases')) {
        console.error("❌ ไม่พบ Store 'databases' ใน IndexedDB");
        return;
      }

      const transaction = db.transaction(['databases'], 'readonly');
      const store = transaction.objectStore('databases');
      const getReq = store.get(dbName);

      getReq.onsuccess = () => {
        if (!getReq.result || !getReq.result.data) {
          console.error("❌ ไม่พบข้อมูลไฟล์ .db ใน Store");
          return;
        }

        // 4. สร้าง Blob และดาวน์โหลด
        const blob = new Blob([getReq.result.data], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `piggyplan_local.db`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("✅ ดาวน์โหลดสำเร็จ! นำไฟล์ไปเปิดใน DBeaver ได้เลย");
      };
    };
    
    request.onerror = () => console.error("❌ ไม่สามารถเปิด IndexedDB ได้");
    
  } catch (e) {
    console.error("Download failed", e);
  }
}

window.downloadDB = downloadDB;

