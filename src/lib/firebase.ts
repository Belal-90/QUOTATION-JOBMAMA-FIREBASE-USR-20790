import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

interface FirebaseClientConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

declare global {
  interface Window {
    __FIREBASE_CONFIG__?: Partial<FirebaseClientConfig>
  }
}

interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  db: Firestore
  storage: FirebaseStorage
}

const envConfig: Partial<FirebaseClientConfig> = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function readRuntimeConfig(): Partial<FirebaseClientConfig> {
  if (typeof window === 'undefined') return {}
  return window.__FIREBASE_CONFIG__ ?? {}
}

function getMergedConfig(): Partial<FirebaseClientConfig> {
  const runtime = readRuntimeConfig()
  return {
    apiKey: runtime.apiKey || envConfig.apiKey,
    authDomain: runtime.authDomain || envConfig.authDomain,
    projectId: runtime.projectId || envConfig.projectId,
    storageBucket: runtime.storageBucket || envConfig.storageBucket,
    messagingSenderId: runtime.messagingSenderId || envConfig.messagingSenderId,
    appId: runtime.appId || envConfig.appId,
  }
}

function getMissingKeys(config: Partial<FirebaseClientConfig>): string[] {
  const required: Array<keyof FirebaseClientConfig> = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ]
  return required.filter((key) => !String(config[key] ?? '').trim())
}

function createConfigError(missingKeys: string[]): Error {
  const message = [
    'Firebase configuration is missing or invalid.',
    `Missing: ${missingKeys.join(', ')}`,
    'Set VITE_FIREBASE_* env vars on your hosting platform, or define window.__FIREBASE_CONFIG__ in /public/firebase-config.js.',
  ].join(' ')
  return new Error(message)
}

let services: FirebaseServices | null = null
let initError: Error | null = null

function initFirebase(): void {
  if (services || initError) return
  const merged = getMergedConfig()
  const missing = getMissingKeys(merged)
  if (missing.length > 0) {
    initError = createConfigError(missing)
    return
  }

  try {
    const fullConfig = merged as FirebaseClientConfig
    const app = initializeApp(fullConfig)
    services = {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
      storage: getStorage(app),
    }
  } catch (err) {
    initError = err instanceof Error ? err : new Error('Failed to initialize Firebase.')
  }
}

export function getFirebaseServices(): FirebaseServices {
  initFirebase()
  if (!services) {
    throw initError ?? new Error('Firebase was not initialized.')
  }
  return services
}

export function getFirebaseInitError(): Error | null {
  initFirebase()
  return initError
}
