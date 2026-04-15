export type BaanxCardStatusValue = "ACTIVE" | "FROZEN" | "BLOCKED";
export type BaanxCardType = "VIRTUAL" | "PHYSICAL" | "METAL";

export interface BaanxCardStatus {
  id: string;
  holderName: string;
  expiryDate: string;
  panLast4: string;
  status: BaanxCardStatusValue;
  type: BaanxCardType;
  orderedAt: string;
}

export type BaanxTransactionSign = "DEBIT" | "CREDIT";
export type BaanxTransactionStatus = "CONFIRMED" | "PENDING" | "DECLINED" | "REVERTED";

export type BaanxMccCategory =
  | "SUBSCRIPTIONS"
  | "FOOD"
  | "TRAVEL"
  | "ENTERTAINMENT"
  | "HEALTH"
  | "ATM"
  | "UTILITIES"
  | "MISC";

export interface BaanxFundingSource {
  id: string;
  address: string;
  network: "linea" | "solana" | "ethereum";
  txHash: string;
  currency: string;
  amount: string;
  fees: string;
  swapFee: string;
  sign: BaanxTransactionSign;
  status: "CONFIRMED" | "PENDING" | "DECLINED";
  dateTime: string;
}

export interface BaanxTransaction {
  id: string;
  cardId: string;
  panLast4: string;
  transactionId: string;
  dateTime: string;
  sign: BaanxTransactionSign;
  merchantNameLocation: string;
  merchantType: string;
  mcc: number;
  mccCategory: BaanxMccCategory;
  transactionCurrency: string;
  amountInTransactionCurrency: string;
  feesInTransactionCurrency: string;
  originalCurrency: string;
  amountInOriginalCurrency: string;
  feesInOriginalCurrency: string;
  billingConversionRate: string;
  ecbRate: string;
  status: BaanxTransactionStatus;
  declineReason?: string;
  fundingSources: BaanxFundingSource[];
}

export interface BaanxTransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  searchKey?: string;
  mccCategories?: string;
  page?: number;
}
