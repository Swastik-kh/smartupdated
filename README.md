
<div align="center">
<img width="1200" height="475" alt="Smart Inventory Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Smart Inventory Management System

यो एक व्यावसायिक जिन्सी व्यवस्थापन प्रणाली हो।

## Domain Configuration (Domain Connect गर्ने तरिका)

तपाईंको डोमेन प्यानल (Domain Registrar) मा गएर निम्न **DNS Records** हरू भर्नुहोस्:

### 1. A Record
- **Name/Host:** `@`
- **Value/IP:** `76.76.21.21`

### 2. CNAME Record
- **Name/Host:** `www`
- **Value/Target:** `cname.vercel-dns.com`

> **नोट:** "Private Name Servers" वा "Register NameServer" मा केही पनि परिवर्तन नगर्नुहोस्। केवल "DNS Management" मा गएर माथिका रेकर्डहरू थप्नुहोस्।

---

## मुख्य सुविधाहरू (Key Features)
- **सुरक्षित लगइन:** आर्थिक वर्ष (Fiscal Year), प्रयोगकर्ता नाम र पासवर्ड।
- **खोप व्यवस्थापन:** रेबिज क्लिनिक (0.2ml/dose rule) र रिपोर्टिङ।
- **जिन्सी चक्र:** माग फारम (४०१) देखि दाखिला (४०३) र निकासा (४०४) सम्म।
- **स्टोर सेटअप:** बहु-स्टोर व्यवस्थापन र स्टक लेभल ट्र्याकिङ।

## कसरी चलाउने?
1. `npm install` गर्नुहोस्।
2. `npm run dev` बाट लोकलमा चलाउनुहोस्।
3. `npm run build` बाट प्रोडक्सनको लागि तयार गर्नुहोस्।
