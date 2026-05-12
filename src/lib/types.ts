export interface BusinessDetails {
  id?: string;
  name: string;
  gstin: string;
  tan: string;
  pan: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pin: string;
  mobileNumber: string;
  mailId: string;
  website: string;
  logoUrl?: string;
}

export interface Party {
  id: string;
  name: string;
  gstin?: string;
  pan?: string;
  tan?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pin: string;
  mobileNumber: string;
  mailId?: string;
  website?: string;
  balance: number; // Receivable (+) or Payable (-)
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  hsnCode: string;
  price: number;
  taxRate: number; // in percentage
  itemCode?: string;
  barcode?: string;
  sellingPrice: number;
  isInclusive: boolean;
  stock: number;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  taxRate: number;
  discountValue: number;
  discountType: 'fixed' | 'percentage';
  hsnCode: string;
  itemCode?: string;
  barcode?: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  referenceNo?: string;
  dueDate: string;
  partyId: string;
  partyName: string;
  partyGstin?: string;
  type: 'sales' | 'purchase';
  isReturn?: boolean;
  items: InvoiceItem[];
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalDiscount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  date: string;
  partyId: string;
  partyName: string;
  type: 'payment' | 'receipt';
  amount: number;
  paymentMethod: string;
  transactionId: string;
  receiverName?: string;
  signatureData?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  partyId: string;
  type: 'invoice' | 'voucher';
  refId: string;
  refNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
