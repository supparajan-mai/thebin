# The Bin — Setup Guide: Firebase Auth + Omise Payment

## ภาพรวมระบบ

```
ลูกค้า → กรอกเบอร์ → OTP SMS → login
       → เลือกสกิน → Omise Popup → Cloud Function → Firestore
       → เปลี่ยนเครื่อง → login ด้วยเบอร์เดิม → สกินกลับมาทันที
```

---

## ขั้นตอนที่ 1: สร้าง Firebase Project

1. ไปที่ https://console.firebase.google.com
2. คลิก **Add project** → ตั้งชื่อ `thebin` → Create
3. ไปที่ **Project Settings** (ไอคอนเฟือง) → **Your apps**
4. คลิก `</>` (Web app) → ตั้งชื่อ `thebin-web` → Register
5. **คัดลอก firebaseConfig** ที่ได้ → วางใน `src/firebase.js`

```js
// src/firebase.js — แทนค่าเหล่านี้
const firebaseConfig = {
  apiKey:            "AIza...",
  authDomain:        "thebin-xxxx.firebaseapp.com",
  projectId:         "thebin-xxxx",
  storageBucket:     "thebin-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc123",
};
```

---

## ขั้นตอนที่ 2: เปิด Firebase Phone Authentication

1. Firebase Console → **Authentication** → **Sign-in method**
2. คลิก **Phone** → Enable → Save
3. (สำหรับ test) เพิ่ม **Phone numbers for testing**:
   - เบอร์: `+66812345678`
   - OTP: `123456`
   - ใช้ทดสอบได้โดยไม่เสีย SMS quota

---

## ขั้นตอนที่ 3: ตั้งค่า Firestore

1. Firebase Console → **Firestore Database** → Create database
2. เลือก **Start in production mode** → เลือก region `asia-southeast1` (Singapore)
3. Deploy security rules:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # เลือก project thebin-xxxx
firebase deploy --only firestore:rules
```

โครงสร้าง Firestore ที่จะถูกสร้างอัตโนมัติ:
```
users/
  {uid}/
    purchases: ["skin_chat", "skin_email"]   ← Cloud Function เขียน
    updatedAt: timestamp

orders/
  {omiseChargeId}/
    uid: "user123"
    itemId: "skin_chat"
    status: "pending" | "paid"
    createdAt: timestamp
    paidAt: timestamp
```

---

## ขั้นตอนที่ 4: Deploy Cloud Functions

```bash
cd functions/

# ตั้งค่า environment variables
firebase functions:config:set \
  omise.secret_key="skey_live_XXXX" \
  omise.webhook_secret="whsec_XXXX"

# Deploy
firebase deploy --only functions
```

หลัง deploy จะได้ URLs ประมาณนี้:
```
✔ functions[createCharge]: https://asia-southeast1-thebin-xxxx.cloudfunctions.net/createCharge
✔ functions[omiseWebhook]: https://asia-southeast1-thebin-xxxx.cloudfunctions.net/omiseWebhook
```

**อัปเดต URL ใน `src/Marketplace.jsx`:**
```js
const CLOUD_FN_URL = 'https://asia-southeast1-thebin-xxxx.cloudfunctions.net/createCharge';
```

---

## ขั้นตอนที่ 5: ตั้งค่า Omise

### 5.1 Public Key (Frontend)
1. https://dashboard.omise.co → Keys
2. คัดลอก **Public Key** (`pkey_...`)
3. วางใน `src/Marketplace.jsx`:
```js
const OMISE_PUBLIC_KEY = 'pkey_live_XXXX';
```

### 5.2 Secret Key (Cloud Function — ทำไปแล้วใน step 4)
ใช้ `skey_live_XXXX` จาก Omise Dashboard

### 5.3 Webhook
1. Omise Dashboard → **Webhooks** → Add endpoint
2. URL: `https://asia-southeast1-thebin-xxxx.cloudfunctions.net/omiseWebhook`
3. Events: เลือก **charge.complete**
4. คัดลอก **Webhook Secret** → ใส่ใน functions config:
```bash
firebase functions:config:set omise.webhook_secret="whsec_XXXX"
firebase deploy --only functions
```

---

## ขั้นตอนที่ 6: เพิ่ม Authorized Domain สำหรับ reCAPTCHA

Firebase Phone Auth ต้องการ domain ที่ได้รับอนุญาต:

1. Firebase Console → Authentication → **Settings** → **Authorized domains**
2. เพิ่ม domain ของคุณ เช่น `thebin.netlify.app` หรือ custom domain

---

## ขั้นตอนที่ 7: Build และ Deploy Frontend

```bash
# ที่ root ของ project
npm run build

# Deploy ขึ้น Netlify (ถ้าใช้ Netlify)
# ลาก folder dist/ ไปวางใน Netlify dashboard
# หรือใช้ Netlify CLI:
netlify deploy --prod --dir=dist
```

---

## การทดสอบ End-to-End

### Test Flow:
1. เปิดแอป → ไป Shop tab
2. คลิก **Login** → กรอกเบอร์ทดสอบ `0812345678`
3. Firebase จะส่ง OTP จริง (หรือใช้ `123456` ถ้าตั้ง test number)
4. Login สำเร็จ → เห็นเบอร์โทรที่ header ของ Shop
5. คลิก **ซื้อเลย!** → Omise popup เปิด
6. ใช้บัตรทดสอบ Omise: `4242 4242 4242 4242` / CVV: `123` / Exp: `12/25`
7. ชำระเงิน → สกินปลดล็อก → nav bar แสดง icon โดยไม่มี 🔒

### ทดสอบข้ามเครื่อง:
1. เปิดแอปใน browser ใหม่ (หรือ Incognito)
2. Login ด้วยเบอร์เดิม → สกินกลับมาทันที ✅

---

## ค่าใช้จ่ายโดยประมาณ

| บริการ | ฟรี | หลังจากนั้น |
|--------|-----|------------|
| Firebase Auth SMS | 10,000/เดือน | ~$0.01/SMS |
| Firestore reads | 50,000/วัน | $0.06/100K |
| Cloud Functions | 2M calls/เดือน | $0.40/M |
| Omise | ฟรีตั้งค่า | 3.65% + 15฿/transaction |

**สรุป:** ถ้ายอดขาย 100 ชิ้น/เดือน ค่าใช้จ่ายโครงสร้างพื้นฐาน ≈ 0฿ (อยู่ใน free tier ทั้งหมด)
