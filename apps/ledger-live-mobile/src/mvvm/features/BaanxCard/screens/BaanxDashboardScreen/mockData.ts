import type { TransactionItem } from "./mapCardTransaction";

export interface CardData {
  readonly panLast4: string;
  readonly panFull: string;
  readonly expiryDate: string;
  readonly cvv: string;
  readonly balance: string;
  readonly cashback: string;
  readonly currency: string;
  readonly customBackground?: "ledger";
}

// TODO: replace with real API data once Baanx endpoints are integrated
export const MOCK_CARDS: readonly CardData[] = [
  {
    panLast4: "4829",
    panFull: "4658  1234  5678  4829",
    expiryDate: "09/28",
    cvv: "731",
    balance: "2 450,00",
    cashback: "12 302",
    currency: "€",
  },
  {
    panLast4: "7712",
    panFull: "5321  9876  5432  7712",
    expiryDate: "03/27",
    cvv: "458",
    balance: "1 120,50",
    cashback: "4 870",
    currency: "$",
  },
  {
    panLast4: "0091",
    panFull: "4917  6543  2109  0091",
    expiryDate: "11/29",
    cvv: "902",
    balance: "890,00",
    cashback: "1 205",
    currency: "£",
    customBackground: "ledger",
  },
];

export const MOCK_TRANSACTIONS: readonly TransactionItem[] = [
  {
    id: "1",
    merchant: "Uniqlo",
    date: "Today 12:43",
    amount: "-€120.43",
    currency: "USDC",
    logoColor: "#ED1D24",
    status: "Pending",
    cardLast4: "4829",
    cryptoAmount: "0.6329238",
    cryptoCurrency: "USDC",
    cashbackAmount: "0.0000003",
    cashbackCurrency: "BTC",
  },
  {
    id: "2",
    merchant: "Amazon",
    date: "Today 09:15",
    amount: "-€54.99",
    currency: "USDT",
    logoColor: "#FF9900",
    status: "Completed",
    cardLast4: "4829",
    cryptoAmount: "55.12",
    cryptoCurrency: "USDT",
    cashbackAmount: "0.0000001",
    cashbackCurrency: "BTC",
  },
  {
    id: "3",
    merchant: "Uber",
    date: "15 Apr 18:30",
    amount: "-€12.50",
    currency: "USDC",
    logoColor: "#000000",
    status: "Completed",
    cardLast4: "4829",
  },
];
