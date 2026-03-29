// ==========================================
// EG Build Agent Types
// 10 agents, 23 sub-agents, 3 layers
// Based on EG OS v3 architecture
// ==========================================

export type MessageType = 'text' | 'audio' | 'image' | 'document'
export type DetectedLanguage = 'en' | 'pt' | 'es' | 'mixed'

export type Intent =
  | 'DESPESA'        // expense report
  | 'INVOICE'        // create/send invoice
  | 'BILL'           // accounts payable (received invoice)
  | 'CONSULTA'       // query/check balance
  | 'CHANGE_ORDER'   // project change order
  | 'COTACAO'        // quote request
  | 'FOTO'           // photo of receipt/invoice
  | 'APROVACAO'      // approval request
  | 'GENERAL'        // general/unknown

export interface ReceivedMessage {
  id: string
  from: string
  type: MessageType
  text?: string
  audioUrl?: string
  audioBase64?: string
  imageUrl?: string
  documentUrl?: string
  fileName?: string
  mimeType?: string
  caption?: string
  timestamp: string
}

export interface LinguistOutput {
  originalText: string
  cleanText: string          // normalized, cleaned text
  translatedText: string     // always English
  detectedLanguage: DetectedLanguage
  confidence: number         // 0-1
  isCodeSwitching: boolean   // mixing languages
}

export interface ClassifierOutput {
  intent: Intent
  confidence: number
  extractedData: ExtractedData
  rawReasoning?: string
}

export interface ExtractedData {
  amount?: number
  vendor?: string
  customer?: string
  project?: string
  category?: string
  invoiceNumber?: string
  description: string
  date?: string
  items?: Array<{ description: string; quantity: number; unitPrice: number }>
  documentType?: string // W-9, COI, license, lien waiver
}

export interface FiscalValidation {
  isValid: boolean
  salesTaxApplied: boolean
  salesTaxAmount: number
  salesTaxRate: number
  isTaxExempt: boolean
  exemptReason?: string
  requires1099: boolean
  vendorTotal1099: number   // accumulated for this vendor this year
  threshold1099: number     // $600
  warnings: string[]
}

export interface QAResult {
  approved: boolean
  score: number             // 0-100
  criteria: {
    notGeneric: number      // 30 pts
    hasNextStep: number     // 20 pts
    connectsToDNA: number   // 25 pts
    correctFormat: number   // 15 pts
    noHallucination: number // 10 pts
  }
  retryCount: number
  escalated: boolean
  feedback?: string
}

export interface AgentResponse {
  agentName: string
  success: boolean
  data: unknown
  message: string           // formatted response for user
  language: DetectedLanguage
  qaResult?: QAResult
  nextActions?: string[]
}
