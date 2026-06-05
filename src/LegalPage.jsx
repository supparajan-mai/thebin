import { motion } from 'framer-motion';
import { useLang } from './i18n.jsx';

const CONTENT = {
  th: {
    terms_title: 'เงื่อนไขการใช้งาน',
    terms: `
**1. การยอมรับเงื่อนไข**
การใช้งาน The Bin ("แอป") ถือว่าคุณยอมรับเงื่อนไขเหล่านี้ทั้งหมด

**2. การซื้อสกินและดิจิทัลคอนเทนต์**
- สกินทั้งหมดเป็นสินค้าดิจิทัล ไม่สามารถคืนเงินได้หลังจากปลดล็อกแล้ว
- การซื้อจะผูกกับเบอร์โทรที่ใช้ login และซิงค์ข้ามเครื่องได้

**3. ข้อจำกัดการใช้งาน**
- ห้ามใช้แอปในการคุกคาม หรือโพสต์เนื้อหาที่เป็นอันตรายต่อผู้อื่น
- แอปนี้ออกแบบมาเพื่อการระบายอารมณ์ส่วนตัวเท่านั้น

**4. การยกเลิกบริการ**
เราขอสงวนสิทธิ์ในการระงับบัญชีที่ละเมิดเงื่อนไขการใช้งาน

**5. ติดต่อ**
หากมีคำถามเกี่ยวกับเงื่อนไขการใช้งาน กรุณาติดต่อเราผ่าน LINE Official @tangjaicraft
    `,
    refund_title: 'นโยบายการคืนเงิน',
    refund: `
**ภาพรวม**
The Bin จำหน่ายดิจิทัลคอนเทนต์และไอเทมตกแต่ง (สกินและเอฟเฟกต์พิเศษ) ที่ปลดล็อกการใช้งานทันทีหลังชำระเงิน

**สินค้าที่ไม่สามารถคืนเงินได้**
- เมื่อดิจิทัลคอนเทนต์หรือสกินถูกส่งมอบ/ปลดล็อกเรียบร้อยแล้ว การซื้อนั้นถือเป็นที่สิ้นสุดและไม่สามารถขอคืนเงินได้
- เนื่องจากเป็นสินค้าดิจิทัลที่ใช้งานได้ทันที จึงไม่มีการคืนสินค้า

**กรณีชำระเงินสำเร็จแต่ยังไม่ได้รับสิทธิ์**
- หากการชำระเงินสำเร็จแต่คอนเทนต์ไม่ถูกปลดล็อก กรุณาติดต่อฝ่ายสนับสนุนเพื่อตรวจสอบและแก้ไข
- เราจะตรวจสอบรายการและปลดล็อกให้ หรือคืนเงินหากไม่สามารถส่งมอบสินค้าได้

**ระยะเวลาในการติดต่อ**
กรุณาติดต่อเราภายใน 7 วันหลังการชำระเงิน พร้อมแจ้งเบอร์โทรที่ใช้ login และรายการที่ซื้อ

**ช่องทางติดต่อ**
LINE Official @tangjaicraft — เราจะตอบกลับโดยเร็วที่สุด
    `,
    privacy_title: 'นโยบายความเป็นส่วนตัว',
    privacy: `
**ข้อมูลที่เราเก็บ**
- เบอร์โทรศัพท์ — ใช้สำหรับยืนยันตัวตนและซิงค์การซื้อข้ามเครื่อง
- รายการสกินที่ซื้อ — เพื่อ restore การซื้อเมื่อเปลี่ยนเครื่อง
- ข้อมูล Analytics — จำนวนผู้ใช้, feature ที่ใช้บ่อย (ไม่ระบุตัวตน)

**สิ่งที่เราไม่เก็บ**
- ข้อความที่คุณพิมพ์ระบาย — ทุกอย่างหายไปทันทีหลังกด "ทิ้ง!"
- รูปที่วาด — ไม่มีการบันทึกลง server ใดๆ
- เสียงที่พูด — ประมวลผลในเครื่องเท่านั้น

**การแชร์ข้อมูล**
เราไม่แชร์ข้อมูลส่วนตัวให้บุคคลที่สาม ยกเว้น:
- Firebase (Google) — ใช้สำหรับ Authentication และ Database
- Omise — ใช้สำหรับประมวลผลการชำระเงิน

**สิทธิ์ของคุณ**
คุณสามารถขอลบข้อมูลทั้งหมดได้ตลอดเวลา โดยติดต่อเราโดยตรง

**การเปลี่ยนแปลงนโยบาย**
เราจะแจ้งให้ทราบหากมีการเปลี่ยนแปลงนโยบายที่สำคัญ
    `,
  },
  en: {
    terms_title: 'Terms of Service',
    terms: `
**1. Acceptance of Terms**
By using The Bin ("App"), you agree to these terms in full.

**2. Digital Purchases**
- All skins are digital goods and are non-refundable once unlocked.
- Purchases are tied to your phone number and sync across devices.

**3. Acceptable Use**
- Do not use the App to harass others or create harmful content.
- This App is designed for private emotional release only.

**4. Account Suspension**
We reserve the right to suspend accounts that violate these terms.

**5. Contact**
For questions about these terms, please contact us via our LINE Official account @tangjaicraft.
    `,
    refund_title: 'Refund Policy',
    refund: `
**Overview**
The Bin sells digital content and cosmetic unlocks (skins and special effects) that are activated immediately after a successful payment.

**Non-Refundable Purchases**
- Once digital content or a skin has been successfully delivered/unlocked, the purchase is final and non-refundable.
- Because these are instantly usable digital goods, no returns are possible.

**Payment Succeeded but Content Not Unlocked**
- If your payment succeeds but the content is not unlocked, please contact support so we can verify and resolve it.
- We will review the transaction and unlock your item, or issue a refund if delivery cannot be completed.

**Time Limit**
Please contact us within 7 days of payment, including the phone number used to log in and the item purchased.

**Contact**
LINE Official @tangjaicraft — we will respond as soon as possible.
    `,
    privacy_title: 'Privacy Policy',
    privacy: `
**What We Collect**
- Phone number — used for authentication and purchase sync across devices
- Purchased skins — to restore your purchases on new devices
- Analytics data — usage counts, popular features (anonymized, no PII)

**What We Never Collect**
- Your typed vents — everything is deleted immediately when you tap "Toss It!"
- Your drawings — never sent to any server
- Your voice — processed on-device only

**Data Sharing**
We do not sell or share personal data with third parties, except:
- Firebase (Google) — Authentication and Database
- Omise — Payment processing

**Your Rights**
You can request deletion of all your data at any time by contacting us directly.

**Policy Changes**
We will notify users of any significant changes to this policy.
    `,
  },
};

function renderMarkdown(text) {
  return text.trim().split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} style={{ fontWeight: 700, color: '#1a1a2e', marginTop: 14, marginBottom: 4, fontSize: 13 }}>{line.replace(/\*\*/g, '')}</div>;
    }
    if (line.startsWith('- ')) {
      return <div key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, paddingLeft: 12 }}>• {line.slice(2)}</div>;
    }
    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
    return <div key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.7 }}>{line}</div>;
  });
}

export default function LegalPage({ page, onClose }) {
  const { lang } = useLang();
  const c = CONTENT[lang];
  const titleMap = { terms: c.terms_title, refund: c.refund_title, privacy: c.privacy_title };
  const bodyMap = { terms: c.terms, refund: c.refund, privacy: c.privacy };
  const title = titleMap[page] || c.terms_title;
  const body = bodyMap[page] || c.terms;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fef3c7', borderRadius: '14px 14px 0 0',
          border: '4px solid #1a1a2e', borderBottom: 'none',
          width: '100%', maxWidth: 480,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -6px 0 #1a1a2e',
        }}
      >
        {/* Header */}
        <div style={{
          background: '#1a1a2e', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: '10px 10px 0 0',
        }}>
          <div style={{ fontFamily: "'Bangers',cursive", fontSize: 18, color: '#fef3c7', letterSpacing: 2 }}>
            {title}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#fef3c7',
            fontSize: 20, cursor: 'pointer', padding: 0,
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 24px' }}>
          {renderMarkdown(body)}
        </div>
      </motion.div>
    </motion.div>
  );
}
