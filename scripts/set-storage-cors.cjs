/**
 * Firebase Storage বাকেটে CORS সেট করে (সিগনেচার/স্ট্যাম্প আপলোড CORS এরর ঠিক করতে)।
 * একবার চালান: node scripts/set-storage-cors.cjs
 *
 * প্রয়োজন:
 * 1. Firebase Console → Project settings → Service accounts → "Generate new private key"
 * 2. JSON ফাইলটি প্রজেক্ট রুটে firebase-service-account.json নামে সেভ করুন
 * 3. npm install (যদি @google-cloud/storage ইতিমধ্যে না থাকে)
 */

const path = require('path')
const fs = require('fs')

const keyPath = path.join(__dirname, '..', 'firebase-service-account.json')
const corsPath = path.join(__dirname, '..', 'storage-cors.json')

if (!fs.existsSync(keyPath)) {
  console.error(`
  ❌ firebase-service-account.json পাওয়া যাচ্ছে না।

  করুন:
  1. https://console.firebase.google.com → আপনার প্রজেক্ট → ⚙️ Project settings
  2. Service accounts ট্যাব → "Generate new private key" ক্লিক করুন
  3. ডাউনলোড করা JSON ফাইলটি এই প্রজেক্টের রুট ফোল্ডারে কপি করুন
  4. নাম দিন: firebase-service-account.json
  5. আবার চালান: node scripts/set-storage-cors.cjs
  `)
  process.exit(1)
}

if (!fs.existsSync(corsPath)) {
  console.error('❌ storage-cors.json পাওয়া যাচ্ছে না। প্রজেক্ট রুটে থাকা উচিত।')
  process.exit(1)
}

const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
const envPath = path.join(__dirname, '..', '.env')
let bucketName = process.env.FIREBASE_STORAGE_BUCKET
if (!bucketName && fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8')
  const m = env.match(/VITE_FIREBASE_STORAGE_BUCKET=(.+)/)
  if (m) bucketName = m[1].trim().replace(/^["']|["']$/g, '')
}
if (!bucketName) bucketName = key.project_id + '.appspot.com'
const corsConfig = JSON.parse(fs.readFileSync(corsPath, 'utf8'))

async function main() {
  const { Storage } = require('@google-cloud/storage')
  const storage = new Storage({ credentials: key, projectId: key.project_id })
  const namesToTry = [bucketName]
  if (bucketName.endsWith('.firebasestorage.app')) {
    namesToTry.push(key.project_id + '.appspot.com')
  }
  if (bucketName.endsWith('.appspot.com')) namesToTry.push(key.project_id)
  let lastErr
  for (const name of namesToTry) {
    try {
      const bucket = storage.bucket(name)
      console.log('CORS সেট করা হচ্ছে বাকেট:', name)
      await bucket.setCorsConfiguration(corsConfig)
      console.log('✅ CORS সফলভাবে সেট হয়েছে। এখন ব্রাউজার রিফ্রেশ করে আবার আপলোড চেষ্টা করুন।')
      return
    } catch (e) {
      lastErr = e
      if (!e.message || !e.message.includes('does not exist')) throw e
    }
  }
  console.log('প্রজেক্টের বাকেটগুলো খুঁজে CORS সেট করার চেষ্টা করা হচ্ছে...')
  try {
    const [buckets] = await storage.getBuckets()
    if (buckets && buckets.length > 0) {
      for (const b of buckets) {
        const name = b.name
        try {
          console.log('CORS সেট করা হচ্ছে বাকেট:', name)
          await b.setCorsConfiguration(corsConfig)
          console.log('✅ CORS সফলভাবে সেট হয়েছে। এখন ব্রাউজার রিফ্রেশ করে আবার আপলোড চেষ্টা করুন।')
          return
        } catch (e) {
          lastErr = e
        }
      }
    } else {
      console.error('   এই প্রজেক্টে কোনো বাকেট নেই (নতুন Firebase Storage প্রজেক্টে এমন হতে পারে)।')
      console.error('')
      console.error('   চেষ্টা করুন:')
      console.error('   1. Firebase Console → Build → Storage → Get started → ডিফল্ট বাকেট তৈরি করুন।')
      console.error('   2. তারপর আবার চালান: npm run setup-storage-cors')
      console.error('   3. অথবা Google Cloud Console → Storage → আপনার বাকেট খুলে CORS ট্যাব থেকে সেট করুন।')
    }
  } catch (listErr) {
    if (listErr.code === 403 || (listErr.message && listErr.message.includes('Permission'))) {
      console.error('   সেবা অ্যাকাউন্টের অ্যাক্সেস নেই। Firebase Console → Project settings → Service accounts → সেবা অ্যাকাউন্টে "Storage Admin" বা "Editor" রোল দিন।')
    }
    lastErr = listErr
  }
  throw lastErr
}

main().catch((err) => {
  console.error('❌ CORS সেট করতে সমস্যা:', err.message)
  if (err.message && err.message.includes('Could not load the default credentials')) {
    console.error('   নিশ্চিত করুন firebase-service-account.json সঠিক এবং প্রজেক্ট রুটে আছে।')
  }
  if (err.message && err.message.includes('does not exist')) {
    console.error('   • Firebase Console → Build → Storage → Storage চালু আছে কিনা দেখুন (Get started চাপুন যদি না থাকে)।')
    console.error('   • Project settings → General → "Storage bucket" এ যে নাম দেখাচ্ছে সেটা .env এর VITE_FIREBASE_STORAGE_BUCKET এ দিন।')
    console.error('   • অথবা টার্মিনালে: set FIREBASE_STORAGE_BUCKET=বাকেট_নাম && npm run setup-storage-cors')
  }
  process.exit(1)
})
