import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import type { Quotation, QuotationRow } from '../types'

const COLLECTION = 'quotations'

/** Firestore does not accept undefined; remove such keys before write. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out
}

function mapDoc(id: string, data: Record<string, unknown>): Quotation {
  const q = data as Record<string, unknown>
  return {
    id,
    userId: q.userId as string,
    createdAt: (q.createdAt as Timestamp)?.toDate?.() ?? (q.createdAt as Date),
    date: (q.date as string) ?? '',
    supplyName: (q.supplyName as string) ?? '',
    supplyCrNo: (q.supplyCrNo as string) ?? '',
    supplyAddress: (q.supplyAddress as string) ?? '',
    kindAttention: (q.kindAttention as string) ?? '',
    clientName: (q.clientName as string) ?? '',
    clientCrNo: (q.clientCrNo as string) ?? '',
    clientAddress: (q.clientAddress as string) ?? '',
    greetingText: (q.greetingText as string) ?? '',
    rows: Array.isArray(q.rows) ? (q.rows as QuotationRow[]) : [],
    termsAndConditions: Array.isArray(q.termsAndConditions) ? (q.termsAndConditions as string[]) : [],
    senderName: (q.senderName as string) ?? '',
    senderTitle: (q.senderTitle as string) ?? '',
    senderMobile: (q.senderMobile as string) ?? '',
    senderEmail: (q.senderEmail as string) ?? '',
    signatureUrl: q.signatureUrl as string | undefined,
    stampUrl: q.stampUrl as string | undefined,
    status: (q.status as 'draft' | 'completed') ?? 'draft',
  }
}

export async function createQuotation(userId: string, data: Omit<Quotation, 'id' | 'userId' | 'createdAt'>): Promise<string> {
  const payload = stripUndefined({
    ...data,
    userId,
    createdAt: serverTimestamp(),
  } as Record<string, unknown>)
  const docRef = await addDoc(collection(db, COLLECTION), payload)
  return docRef.id
}

export async function getQuotationsForUser(userId: string, isAdmin: boolean): Promise<Quotation[]> {
  const col = collection(db, COLLECTION)
  const q = isAdmin
    ? query(col, orderBy('createdAt', 'desc'))
    : query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapDoc(d.id, d.data()))
}

/** রিয়েল-টাইম আপডেট: কোটেশন লিস্টে পরিবর্তন হলে callback কল হয়। unsubscribe করতে returned function কল করুন। */
export function subscribeQuotationsForUser(
  userId: string,
  isAdmin: boolean,
  callback: (quotations: Quotation[]) => void
): () => void {
  const col = collection(db, COLLECTION)
  const q = isAdmin
    ? query(col, orderBy('createdAt', 'desc'))
    : query(col, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const unsubscribe = onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => mapDoc(d.id, d.data()))
    callback(list)
  })
  return unsubscribe
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  const d = await getDoc(doc(db, COLLECTION, id))
  if (!d.exists()) return null
  return mapDoc(d.id, d.data())
}

export async function updateQuotation(id: string, data: Partial<Quotation>): Promise<void> {
  const omit: Record<string, unknown> = { ...data }
  delete omit.id
  delete omit.userId
  delete omit.createdAt
  await updateDoc(doc(db, COLLECTION, id), stripUndefined(omit))
}

export async function deleteQuotation(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}

/** Sanitize filename for Storage: remove spaces and problematic chars to avoid CORS/upload errors. */
function sanitizeStorageFileName(name: string): string {
  const base = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
  return base || 'file'
}

export async function uploadFile(userId: string, path: string, file: File): Promise<string> {
  const safeName = sanitizeStorageFileName(file.name)
  const filePath = `quotations/${userId}/${path}_${Date.now()}_${safeName}`
  const storageRef = ref(storage, filePath)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
