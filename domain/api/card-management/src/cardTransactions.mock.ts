import { PAY_CARD_TRANSACTION_CATEGORIES } from "./schema";
import type { PayCardTransaction } from "./types";

export type PayCardMockTransactionAsset = "usdc" | "btc" | "eth";

let transactionOverride: PayCardTransaction[] | undefined;
let receivedTransactionSerial = 0;

export const documentedPayCardTransaction = {
  id: "100a99cf-f4d3-4fa1-9be9-2e9828b20ebb",
  cardId: "1234537292209260487",
  panLast4: "9189",
  transactionId: "1122334477422",
  dateTime: "2024-10-14T10:44:36.276Z",
  sign: "DEBIT" as const,
  merchantNameLocation: "WWW.ALIEXPRESS.COM, LONDON",
  merchantType: "OutOfWalletOnline",
  mcc: 5964,
  mccCategory: "MISC" as const,
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
  cashback: {
    amount: "0.000104",
    currency: "BXX",
    fiatAmount: "0.01",
    fiatCurrency: "EUR",
    ratePercent: "2",
    status: "EARNED" as const,
  },
};

const MERCHANT_BY_CATEGORY = {
  SUBSCRIPTIONS: "NETFLIX.COM, LOS GATOS",
  FOOD: "STARBUCKS, LONDON",
  TRAVEL: "BRITISH AIRWAYS, LONDON",
  ENTERTAINMENT: "SPOTIFY AB, STOCKHOLM",
  HEALTH: "BOOTS UK, LONDON",
  ATM: "ATM WITHDRAWAL, LONDON",
  UTILITIES: "BRITISH GAS, WINDSOR",
  MISC: documentedPayCardTransaction.merchantNameLocation,
} as const satisfies Record<(typeof PAY_CARD_TRANSACTION_CATEGORIES)[number], string>;

const PAYMENT_BY_CATEGORY = {
  SUBSCRIPTIONS: {
    fiatAmount: "12.99",
    assets: [{ currency: "usdc", amount: "13.0214" }],
  },
  FOOD: {
    fiatAmount: "4.75",
    assets: [{ currency: "btc", amount: "0.00005231" }],
  },
  TRAVEL: {
    fiatAmount: "349.90",
    assets: [
      { currency: "eth", amount: "0.1" },
      { currency: "usdc", amount: "14.82" },
    ],
  },
  ENTERTAINMENT: {
    fiatAmount: "9.99",
    assets: [{ currency: "usdc", amount: "10.0142" }],
  },
  HEALTH: {
    fiatAmount: "26.40",
    assets: [{ currency: "eth", amount: "0.007913" }],
  },
  ATM: {
    fiatAmount: "100.00",
    assets: [{ currency: "btc", amount: "0.00110245" }],
  },
  UTILITIES: {
    fiatAmount: "78.32",
    assets: [{ currency: "usdc", amount: "78.4318" }],
  },
  MISC: {
    fiatAmount: "0.79",
    assets: [{ currency: "usdc", amount: "0.104201" }],
  },
} as const satisfies Record<
  (typeof PAY_CARD_TRANSACTION_CATEGORIES)[number],
  {
    fiatAmount: string;
    assets: readonly { currency: string; amount: string }[];
  }
>;

const STATUS_BY_CATEGORY = {
  SUBSCRIPTIONS: "CONFIRMED",
  FOOD: "PENDING",
  TRAVEL: "REVERTED",
  ENTERTAINMENT: "CONFIRMED",
  HEALTH: "CONFIRMED",
  ATM: "DECLINED",
  UTILITIES: "CONFIRMED",
  MISC: documentedPayCardTransaction.status,
} as const satisfies Record<
  (typeof PAY_CARD_TRANSACTION_CATEGORIES)[number],
  PayCardTransaction["status"]
>;

/** The rate every derived charge earns at. MISC keeps the documented charge's own `"2"` verbatim. */
const CASHBACK_RATE_PERCENT = 1;

/** BXX per unit of fiat, taken from the documented pair so the two cashback amounts agree. */
const MOCK_BXX_PER_FIAT = 0.0104;

/** The statuses a mocked charge carries no cashback on, so an absent one is covered too. */
const UNEARNED_STATUSES = new Set<PayCardTransaction["status"]>(["DECLINED", "REVERTED"]);

function mockCashback(fiatAmount: string) {
  // Rounded first, so the token amount is the fiat one converted rather than a third figure.
  const earned = ((Number(fiatAmount) * CASHBACK_RATE_PERCENT) / 100).toFixed(2);

  return {
    amount: (Number(earned) * MOCK_BXX_PER_FIAT).toFixed(6),
    currency: documentedPayCardTransaction.cashback.currency,
    fiatAmount: earned,
    fiatCurrency: documentedPayCardTransaction.transactionCurrency,
    ratePercent: String(CASHBACK_RATE_PERCENT),
    status: documentedPayCardTransaction.cashback.status,
  };
}

/**
 * A wire-shaped page for the apps' MSW workers: the provider's documented charge, repeated once per
 * spend category, so a transaction list can be seen without a funded card. One category carries
 * each non-confirmed status, so the pending, reverted and declined treatments are visible too, and
 * the two that never settled carry no cashback.
 */
export function mockPayCardTransactions() {
  return PAY_CARD_TRANSACTION_CATEGORIES.map((mccCategory, index) => {
    if (mccCategory === "MISC") return documentedPayCardTransaction;

    const payment = PAYMENT_BY_CATEGORY[mccCategory];
    const status = STATUS_BY_CATEGORY[mccCategory];

    return {
      ...documentedPayCardTransaction,
      id: `${documentedPayCardTransaction.id.slice(0, -1)}${index}`,
      merchantNameLocation: MERCHANT_BY_CATEGORY[mccCategory],
      mccCategory,
      amountInTransactionCurrency: payment.fiatAmount,
      originalCurrency: "EUR",
      amountInOriginalCurrency: payment.fiatAmount,
      billingConversionRate: "1",
      ecbRate: "1",
      status,
      declineReason: status === "DECLINED" ? "INSUFFICIENT_FUNDS" : "",
      fundingSources: payment.assets.map(source => ({
        ...source,
        sign: "DEBIT" as const,
      })),
      // `undefined` keeps every mocked charge one shape, and the key does not survive JSON, so the
      // served page is indistinguishable from one that carries no cashback at all.
      cashback: UNEARNED_STATUSES.has(status) ? undefined : mockCashback(payment.fiatAmount),
    };
  });
}

/** An explicit devtool answer. `undefined` leaves the endpoint under its normal handler. */
export function readPayCardTransactionsMock(): readonly PayCardTransaction[] | undefined {
  return transactionOverride;
}

/** Shows the complete fixture set, including statuses, cashback and mixed funding sources. */
export function fillPayCardTransactionsMock(): void {
  transactionOverride = mockPayCardTransactions();
}

/** Holds the endpoint at an empty list for empty-state QA. */
export function emptyPayCardTransactionsMock(): void {
  transactionOverride = [];
}

/**
 * Adds one newest transaction funded only by the selected asset.
 *
 * Starting from the provider state intentionally creates a one-item list: "Receive" can therefore
 * build a QA history one transaction at a time without first loading the full fixture set.
 */
export function receivePayCardTransactionMock(asset: PayCardMockTransactionAsset): void {
  const template = mockPayCardTransactions().find(transaction =>
    transaction.fundingSources.some(source => source.currency.toLowerCase() === asset),
  );

  if (!template) return;

  receivedTransactionSerial += 1;
  const serial = receivedTransactionSerial;
  const received = {
    ...template,
    id: `devtool-${asset}-${serial}`,
    transactionId: `devtool-${asset}-${serial}`,
    dateTime: new Date().toISOString(),
    fundingSources: template.fundingSources
      .filter(source => source.currency.toLowerCase() === asset)
      .map(source => ({
        ...source,
        id: `devtool-${asset}-source-${serial}`,
        dateTime: new Date().toISOString(),
      })),
  };

  transactionOverride = [received, ...(transactionOverride ?? [])];
}

/** Hands the endpoint back to its normal provider/mock-session behavior. */
export function clearPayCardTransactionsMock(): void {
  transactionOverride = undefined;
}
