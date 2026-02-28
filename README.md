# Quotation Jobmaamaa (Web)

React অ্যাপ্লিকেশন — দক্ষ জনশক্তি সরবরাহের কোটেশন তৈরি ও ব্যবস্থাপনা।  
**Stack:** React, Firebase (Auth, Firestore, Storage), Tailwind CSS, jsPDF + html2canvas।

## সেটআপ

### ১. Firebase প্রজেক্ট

1. [Firebase Console](https://console.firebase.google.com) এ গিয়ে **"Quotation Jobmaamaa"** প্রজেক্ট তৈরি করুন।
2. **Authentication** → Email/Password চালু করুন।
3. **Firestore Database** → Production মোডে ডাটাবেস তৈরি করুন।  
   প্রয়োজনে `quotations` ও `users` কালেকশনের জন্য কম্পোজিট ইন্ডেক্স তৈরি করুন (কনসোল থেকে লিংক দেখাবে)।
4. **Storage** → Firebase Storage চালু করুন (সিগনেচার ও স্ট্যাম্প ছবির জন্য)।

### ২. এনভায়রনমেন্ট ভেরিয়েবল

প্রজেক্টের রুটে `.env` ফাইল তৈরি করে `.env.example` অনুসারে মান পূরণ করুন:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

ইমেইল শেয়ার (ঐচ্ছিক) এর জন্য EmailJS ব্যবহার করলে:

```env
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

### ৩. ইন্সটল ও রান

```bash
npm install
npm run dev
```

ব্রাউজারে `http://localhost:5173` ওপেন করুন।

### ৪. সিগনেচার/স্ট্যাম্প আপলোডে CORS এরর ("blocked by CORS policy" / net::ERR_FAILED)

এই এরর এলে **একবার** Storage বাকেটে CORS সেট করতে হবে। সবচেয়ে সহজ উপায়:

1. Firebase Console → Project settings → Service accounts → **Generate new private key** → ডাউনলোড করা JSON প্রজেক্ট রুটে **`firebase-service-account.json`** নামে সেভ করুন।
2. প্রজেক্ট ফোল্ডারে চালান:
   ```bash
   npm install
   npm run setup-storage-cors
   ```

বিস্তারিত ও gsutil বিকল্প: **[FIREBASE-RULES-SETUP.md](FIREBASE-RULES-SETUP.md)** — "Firebase Storage CORS" সেকশন।

## ফিচার

- **অথেন্টিকেশন:** ইমেইল/পাসওয়ার্ড রেজিস্ট্রেশন ও লগইন; রোল (General / Admin) Firestore `users` কালেকশনে সংরক্ষণ।
- **ড্যাশবোর্ড:** কোটেশন সংখ্যা (Completed, Pending) ও টোটাল ভ্যালিউ; Admin সব কোটেশন, General শুধু নিজের দেখে।
- **কোটেশন ফর্ম:** তারিখ, From/To (সাপ্লাইয়ার ও ক্লায়েন্ট), ডাইনামিক টেবিল (S.L., Category, Rate, Remarks), Terms, সিগনেচার/স্ট্যাম্প আপলোড।
- **CRUD:** Create, View Saved (History), Update/Edit, Delete। Delete এ কনফার্ম মডাল ও ৫ সেকেন্ডের মধ্যে Undo টোস্ট।
- **PDF:** Print (ব্রাউজার প্রিন্ট), Download as PDF (jsPDF + html2canvas), Share via Email (EmailJS যদি কনফিগ করা থাকে)।

## ফায়ারস্টোর ইন্ডেক্স

`quotations` কালেকশনে `userId` + `createdAt` দিয়ে কোয়েরি করলে কম্পোজিট ইন্ডেক্স লাগতে পারে। প্রথমবার কোয়েরি চালালে কনসোলের এরর লিংক থেকে ইন্ডেক্স ক্রিয়েট করুন।

## বিল্ড

```bash
npm run build
```

আউটপুট `dist/` ফোল্ডারে তৈরি হবে।
