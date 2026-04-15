export interface CardData {
  readonly holderName: string;
  readonly panLast4: string;
  readonly panFull: string;
  readonly expiryDate: string;
  readonly cvv: string;
  readonly balance: string;
  readonly currency: string;
}

export interface TransactionItem {
  readonly id: string;
  readonly merchant: string;
  readonly date: string;
  readonly amount: string;
  readonly currency: string;
  readonly logoUri?: string;
  readonly logoColor?: string;
}

// TODO: replace with real API data once Baanx endpoints are integrated
export const MOCK_CARD: CardData = {
  holderName: "MARTIN CAYUELAS",
  panLast4: "4829",
  panFull: "4658  1234  5678  4829",
  expiryDate: "09/28",
  cvv: "731",
  balance: "2 450,00",
  currency: "€",
};

export const MOCK_TRANSACTIONS: readonly TransactionItem[] = [
  {
    id: "1",
    merchant: "Uniqlo",
    date: "Today 12:43",
    amount: "-120.43",
    currency: "USDC",
    logoColor: "#ED1D24",
  },
];

export const MOCK_TOTAL_BALANCE = "2 450,00 €";
export const MOCK_CASHBACK = "$12,302";
