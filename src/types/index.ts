export type UserRole = 'general' | 'admin'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  /** PDF লেটারহেড ব্যাকগ্রাউন্ড ইমেজ URL (সেটিংস থেকে পরিবর্তনযোগ্য) */
  letterheadUrl?: string
}

export interface QuotationRow {
  sl: number
  category: string
  ratePerHour: string
  remarks: string
}

export interface Quotation {
  id?: string
  userId: string
  createdAt: { seconds: number; nanoseconds: number } | Date
  date: string
  supplyName: string
  supplyCrNo: string
  supplyAddress: string
  kindAttention: string
  clientName: string
  clientCrNo: string
  clientAddress: string
  greetingText: string
  rows: QuotationRow[]
  termsAndConditions: string[]
  senderName: string
  senderTitle: string
  senderMobile: string
  senderEmail: string
  signatureUrl?: string
  stampUrl?: string
  status?: 'draft' | 'completed'
}
