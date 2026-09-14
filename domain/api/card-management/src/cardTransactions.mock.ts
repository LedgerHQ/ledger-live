import { PAY_CARD_TRANSACTION_CATEGORIES } from "./schema";

const DOCUMENTED_TRANSACTION = {
  id: "100a99cf-f4d3-4fa1-9be9-2e9828b20ebb",
  cardId: "1234537292209260487",
  panLast4: "9189",
  transactionId: "1122334477422",
  dateTime: "2024-10-14T10:44:36.276Z",
  sign: "DEBIT" as const,
  merchantNameLocation: "WWW.ALIEXPRESS.COM, LONDON",
  merchantType: "OutOfWalletOnline",
  mcc: 5964,
  transactionCurrency: "EUR",
  amountInTransactionCurrency: "0.79",
  feesInTransactionCurrency: "0",
  originalCurrency: "USD",
  amountInOriginalCurrency: "0.85",
  feesInOriginalCurrency: "0",
  billingConversionRate: "0.9294117647058824",
  ecbRate: "0.9161704076958315",
  status: "CONFIRMED" as const,
  declineReason: "",
  fundingSources: [
    {
      id: "3181a37a-07fa-41dc-b423-6c2db07a7ba1",
      address: "0x3a11a86cf218c448be519728cd3ac5c741fb3424",
      network: "linea",
      txHash: "0xb92de09d893e8162b0861c0f7321f68df02212efbc58f208839ae3f176d89638",
      currency: "usdc",
      amount: "0.104201",
      fees: "0",
      swapFee: "0.00208",
      sign: "DEBIT" as const,
      status: "CONFIRMED" as const,
      dateTime: "2024-10-14T10:44:36.288Z",
    },
  ],
};

const MERCHANT_BY_CATEGORY = {
  SUBSCRIPTIONS: "NETFLIX.COM, LOS GATOS",
  FOOD: "STARBUCKS, LONDON",
  TRAVEL: "BRITISH AIRWAYS, LONDON",
  ENTERTAINMENT: "SPOTIFY AB, STOCKHOLM",
  HEALTH: "BOOTS UK, LONDON",
  ATM: "ATM WITHDRAWAL, LONDON",
  UTILITIES: "BRITISH GAS, WINDSOR",
  MISC: DOCUMENTED_TRANSACTION.merchantNameLocation,
} as const satisfies Record<(typeof PAY_CARD_TRANSACTION_CATEGORIES)[number], string>;

/**
 * A wire-shaped page for the apps' MSW workers: the provider's documented charge, repeated once per
 * spend category, so a transaction list can be seen without a funded card.
 */
export function mockPayCardTransactions() {
  return PAY_CARD_TRANSACTION_CATEGORIES.map((mccCategory, index) => ({
    ...DOCUMENTED_TRANSACTION,
    id: `${DOCUMENTED_TRANSACTION.id.slice(0, -1)}${index}`,
    merchantNameLocation: MERCHANT_BY_CATEGORY[mccCategory],
    mccCategory,
  }));
}
