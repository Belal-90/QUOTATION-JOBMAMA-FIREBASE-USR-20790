# Firestore Rules সেটআপ — "Missing or insufficient permissions" ঠিক করতে

এই এরর তখনই আসে যখন Firestore-এ **Security Rules** দিয়ে রেজিস্ট্রেশনের পর `users` বা `quotations` কালেকশনে লিখতে/পড়তে অনুমতি নেই।

## সমাধান: Firebase Console-এ Rules আপডেট করুন

1. **[Firebase Console](https://console.firebase.google.com)** এ যান এবং আপনার প্রজেক্ট সিলেক্ট করুন।
2. বাম পাশে **Firestore Database** → **Rules** ট্যাবে ক্লিক করুন।
3. নিচের রুলস দিয়ে বর্তমান রুলস **রিপ্লেস** করুন (কপি-পেস্ট করুন):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /quotations/{quotationId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

4. **Publish** বাটনে ক্লিক করুন।

এরপর আবার রেজিস্ট্রেশন (Admin User + Admin Secret) চেষ্টা করুন; "Missing or insufficient permissions" আর আসা উচিত না।

---

**সংক্ষেপে রুলসের মানে:**

- **users:** লগইন করা ইউজার শুধু নিজের `users/{userId}` ডকুমেন্ট পড়তে/লিখতে পারবে (রেজিস্ট্রেশনের সময় প্রোফাইল সেভ হবে)।
- **quotations:** ইউজার শুধু নিজের কোটেশন ক্রিয়েট/আপডেট/ডিলিট করতে পারবে; অ্যাডমিন সব কোটেশন পড়তে পারবে。

---

## Firebase Storage Rules — সিগনেচার/স্ট্যাম্প আপলোড ও CORS এরর ঠিক করতে

সিগনেচার বা স্ট্যাম্প ছবি আপলোড করলে **CORS** বা **net::ERR_FAILED** এরর এলে Storage-এ **Security Rules** সেট করুন।

1. **[Firebase Console](https://console.firebase.google.com)** → আপনার প্রজেক্ট → বাম পাশে **Storage** → **Rules** ট্যাব।
2. নিচের রুলস দিয়ে বর্তমান রুলস **রিপ্লেস** করুন এবং **Publish** ক্লিক করুন:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /quotations/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

এর অর্থ: লগইন করা ইউজার শুধু নিজের ফোল্ডার `quotations/{userId}/` তে ফাইল আপলোড/ডাউনলোড করতে পারবে। রুলস পাবলিশ করার পর আবার ছবি আপলোড চেষ্টা করুন।

---

## Firebase Storage CORS — "blocked by CORS policy" / net::ERR_FAILED (আপলোড ও ইমেজ) ঠিক করতে

এই এরর তখনই আসে যখন ব্রাউজার থেকে **localhost** (বা অন্য অরিজিন) থেকে Firebase Storage এ সরাসরি রিকোয়েস্ট যায় — যেমন সিগনেচার/স্ট্যাম্প **আপলোড** বা ইমেজ লোড। **এই এরর ঠিক করতে Storage বাকেটে CORS সেট করা বাধ্যতামূলক।**

### সবচেয়ে সহজ উপায়: Node স্ক্রিপ্ট (gsutil লাগে না)

1. **Firebase Console** → আপনার প্রজেক্ট → ⚙️ **Project settings** → **Service accounts** ট্যাব।
2. **"Generate new private key"** ক্লিক করুন → JSON ডাউনলোড হবে।
3. ডাউনলোড করা ফাইলটি প্রজেক্টের **রুট ফোল্ডারে** কপি করে নাম দিন: **`firebase-service-account.json`** (ইতিমধ্যে .gitignore এ আছে, তাই Git এ যাবে না)।
4. টার্মিনালে প্রজেক্ট ফোল্ডার থেকে চালান:
   ```bash
   npm install
   npm run setup-storage-cors
   ```
5. স্ক্রিপ্ট বাকেট নাম সেবা অ্যাকাউন্ট থেকে নেবে। আলাদা বাকেট ব্যবহার করলে: `set FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com` (Windows) বা `FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com npm run setup-storage-cors` (Mac/Linux) চালান।

সফল হলে "CORS সফলভাবে সেট হয়েছে" মেসেজ দেখাবে। তারপর ব্রাউজার রিফ্রেশ করে আবার আপলোড চেষ্টা করুন।

---

### বিকল্প: gsutil দিয়ে CORS সেট (Google Cloud SDK লাগে)

### ধাপ ১: Google Cloud SDK ইনস্টল ও লগইন

1. [Google Cloud SDK (gsutil সহ) ইনস্টল করুন](https://cloud.google.com/sdk/docs/install)।
2. টার্মিনালে চালান:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
   `YOUR_PROJECT_ID` = Firebase Console → Project settings → General → Project ID (আপনার এররে যে বাকেট নাম দেখা যাচ্ছে, যেমন `kz-ggl-istd-frbs-gt-usr-b20790`, সেটাই প্রজেক্ট আইডি)।

### ধাপ ২: প্রজেক্টের CORS ফাইল ব্যবহার করুন

প্রজেক্টের রুটে ইতিমধ্যে `storage-cors.json` ফাইল আছে (localhost:5173 ও 3000 অরিজিন অ্যালাউ করা)। প্রোডাকশন ডোমেইন যোগ করতে চাইলে এই ফাইলের `origin` অ্যারেতে `"https://your-site.com"` যোগ করুন।

### ধাপ ৩: বাকেটে CORS অ্যাপ্লাই করুন

টার্মিনালে প্রজেক্ট ফোল্ডার থেকে চালান (বাকেটের নাম নিশ্চিত করুন — সাধারণত `PROJECT_ID.appspot.com`):

```bash
gsutil cors set storage-cors.json gs://kz-ggl-istd-frbs-gt-usr-b20790.appspot.com
```

যদি আপনার বাকেট নাম আলাদা হয় (Firebase Console → Project settings → General → Storage bucket), তাহলে ওই নাম ব্যবহার করুন:

```bash
gsutil cors set storage-cors.json gs://YOUR_ACTUAL_BUCKET_NAME
```

**নতুন gcloud ব্যবহার করলে:**

```bash
gcloud storage buckets update gs://kz-ggl-istd-frbs-gt-usr-b20790.appspot.com --cors-file=storage-cors.json
```

### ধাপ ৪: পরীক্ষা

কয়েক সেকেন্ড পর ব্রাউজার রিফ্রেশ করে আবার সিগনেচার/স্ট্যাম্প আপলোড ও PDF এক্সপোর্ট চেষ্টা করুন। CORS এরর চলে যাওয়া উচিত।
