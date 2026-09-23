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

/**
 * The page the mocked provider serves.
 *
 * Six rather than the ten #22236 sliced at, because ten exceeds the eight-charge fixture: the mock
 * answered one page and never paged at all. Against the forty-charge history it makes seven pages,
 * the last of them short, and the page after that empty.
 */
export const MOCK_CARD_TRANSACTIONS_PAGE_SIZE = 6;

/**
 * One page of the mocked history, answering as the provider does: a numeric page past the end
 * gives an empty array, while a missing or non-numeric one falls back to page 0.
 */
export function mockPayCardTransactionsPage(request: Request) {
  const all = readPayCardTransactionsMock() ?? mockPayCardTransactionsHistory();
  const requested = Number(new URL(request.url).searchParams.get("page"));
  const page = Number.isInteger(requested) && requested >= 0 ? requested : 0;
  const start = page * MOCK_CARD_TRANSACTIONS_PAGE_SIZE;

  return all.slice(start, start + MOCK_CARD_TRANSACTIONS_PAGE_SIZE);
}

type HistoryEntry = {
  /** How long before `now` the charge landed. Keeps the history relative, so it never goes stale. */
  readonly minutesAgo: number;
  readonly mccCategory: (typeof PAY_CARD_TRANSACTION_CATEGORIES)[number];
  readonly merchantNameLocation: string;
  readonly amount: string;
  readonly status: "CONFIRMED" | "PENDING" | "DECLINED" | "REVERTED";
  readonly sign?: "DEBIT" | "CREDIT";
  readonly declineReason?: string;
  /** The merchant's own currency, when it is not the card's. */
  readonly abroad?: { currency: string; amount: string; rate: string };
  readonly assets?: readonly { currency: string; amount: string }[];
};

const MINUTE = 1;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * A card's history as it actually looks: weeks of charges, every status, the odd refund, a few
 * foreign-currency purchases and a couple paid from two wallets at once.
 *
 * Newest first, as the provider sends it.
 */
const MOCK_HISTORY: readonly HistoryEntry[] = [
  {
    minutesAgo: 35 * MINUTE,
    mccCategory: "FOOD",
    merchantNameLocation: "PRET A MANGER, LONDON",
    amount: "6.40",
    status: "PENDING",
  },
  {
    minutesAgo: 3 * HOUR,
    mccCategory: "TRAVEL",
    merchantNameLocation: "TRAINLINE, LONDON",
    amount: "42.10",
    status: "PENDING",
  },
  {
    minutesAgo: 7 * HOUR,
    mccCategory: "FOOD",
    merchantNameLocation: "STARBUCKS, LONDON",
    amount: "4.75",
    status: "CONFIRMED",
    assets: [{ currency: "btc", amount: "0.00005231" }],
  },
  {
    minutesAgo: 1 * DAY + 2 * HOUR,
    mccCategory: "SUBSCRIPTIONS",
    merchantNameLocation: "NETFLIX.COM, LOS GATOS",
    amount: "12.99",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 1 * DAY + 9 * HOUR,
    mccCategory: "MISC",
    merchantNameLocation: "WWW.ALIEXPRESS.COM, LONDON",
    amount: "0.79",
    status: "DECLINED",
    declineReason: "Insufficient funds",
  },
  {
    minutesAgo: 2 * DAY,
    mccCategory: "ATM",
    merchantNameLocation: "ATM WITHDRAWAL, LONDON",
    amount: "100.00",
    status: "CONFIRMED",
    assets: [{ currency: "btc", amount: "0.00110245" }],
  },
  {
    minutesAgo: 2 * DAY + 5 * HOUR,
    mccCategory: "HEALTH",
    merchantNameLocation: "BOOTS UK, LONDON",
    amount: "26.40",
    status: "CONFIRMED",
    assets: [{ currency: "eth", amount: "0.007913" }],
  },
  {
    minutesAgo: 3 * DAY,
    mccCategory: "ENTERTAINMENT",
    merchantNameLocation: "SPOTIFY AB, STOCKHOLM",
    amount: "9.99",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 3 * DAY + 6 * HOUR,
    mccCategory: "FOOD",
    merchantNameLocation: "DELIVEROO, LONDON",
    amount: "23.85",
    status: "CONFIRMED",
    assets: [
      { currency: "usdc", amount: "23.91" },
      { currency: "eth", amount: "0.0021" },
    ],
  },
  {
    minutesAgo: 4 * DAY,
    mccCategory: "TRAVEL",
    merchantNameLocation: "UBER BV, AMSTERDAM",
    amount: "18.20",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 4 * DAY + 8 * HOUR,
    mccCategory: "MISC",
    merchantNameLocation: "AMAZON.CO.UK, LONDON",
    amount: "54.99",
    status: "REVERTED",
  },
  {
    minutesAgo: 5 * DAY,
    mccCategory: "FOOD",
    merchantNameLocation: "TESCO EXPRESS, LONDON",
    amount: "31.64",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 5 * DAY + 4 * HOUR,
    mccCategory: "UTILITIES",
    merchantNameLocation: "BRITISH GAS, WINDSOR",
    amount: "78.32",
    status: "CONFIRMED",
    assets: [{ currency: "usdc", amount: "78.4318" }],
  },
  {
    minutesAgo: 6 * DAY,
    mccCategory: "TRAVEL",
    merchantNameLocation: "BOOKING.COM, AMSTERDAM",
    amount: "212.00",
    status: "CONFIRMED",
    abroad: { currency: "USD", amount: "228.64", rate: "0.9272" },
    assets: [
      { currency: "eth", amount: "0.0631" },
      { currency: "usdc", amount: "11.40" },
    ],
  },
  {
    minutesAgo: 7 * DAY,
    mccCategory: "SUBSCRIPTIONS",
    merchantNameLocation: "APPLE.COM/BILL, CORK",
    amount: "2.99",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 7 * DAY + 3 * HOUR,
    mccCategory: "FOOD",
    merchantNameLocation: "CAFFE NERO, LONDON",
    amount: "3.60",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 8 * DAY,
    mccCategory: "ENTERTAINMENT",
    merchantNameLocation: "STEAM GAMES, LONDON",
    amount: "29.99",
    status: "CONFIRMED",
    assets: [{ currency: "usdc", amount: "30.06" }],
  },
  {
    minutesAgo: 9 * DAY,
    mccCategory: "HEALTH",
    merchantNameLocation: "PURE GYM, LONDON",
    amount: "24.99",
    status: "CONFIRMED",
  },
  // A refund, and it earns cashback like any settled charge: the rule keys on status alone, and a
  // clawback is not behaviour the provider documents anywhere.
  {
    minutesAgo: 9 * DAY + 7 * HOUR,
    mccCategory: "MISC",
    merchantNameLocation: "AMAZON.CO.UK, LONDON",
    amount: "54.99",
    status: "CONFIRMED",
    sign: "CREDIT",
  },
  {
    minutesAgo: 10 * DAY,
    mccCategory: "TRAVEL",
    merchantNameLocation: "BRITISH AIRWAYS, LONDON",
    amount: "349.90",
    status: "CONFIRMED",
    assets: [
      { currency: "eth", amount: "0.1" },
      { currency: "usdc", amount: "14.82" },
    ],
  },
  {
    minutesAgo: 11 * DAY,
    mccCategory: "FOOD",
    merchantNameLocation: "SAINSBURYS, LONDON",
    amount: "44.12",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 12 * DAY,
    mccCategory: "UTILITIES",
    merchantNameLocation: "THAMES WATER, READING",
    amount: "39.00",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 13 * DAY,
    mccCategory: "ATM",
    merchantNameLocation: "ATM WITHDRAWAL, BERLIN",
    amount: "50.00",
    status: "CONFIRMED",
    abroad: { currency: "USD", amount: "53.91", rate: "0.9275" },
  },
  {
    minutesAgo: 14 * DAY,
    mccCategory: "SUBSCRIPTIONS",
    merchantNameLocation: "SPOTIFY AB, STOCKHOLM",
    amount: "10.99",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 15 * DAY,
    mccCategory: "FOOD",
    merchantNameLocation: "WAGAMAMA, LONDON",
    amount: "37.50",
    status: "CONFIRMED",
    assets: [{ currency: "usdc", amount: "37.59" }],
  },
  {
    minutesAgo: 16 * DAY,
    mccCategory: "ENTERTAINMENT",
    merchantNameLocation: "ODEON CINEMAS, LONDON",
    amount: "16.80",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 17 * DAY,
    mccCategory: "MISC",
    merchantNameLocation: "ETSY.COM, BROOKLYN",
    amount: "27.35",
    status: "DECLINED",
    declineReason: "Card frozen",
  },
  {
    minutesAgo: 18 * DAY,
    mccCategory: "TRAVEL",
    merchantNameLocation: "TFL TRAVEL CHARGE, LONDON",
    amount: "8.40",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 19 * DAY,
    mccCategory: "HEALTH",
    merchantNameLocation: "SUPERDRUG, LONDON",
    amount: "11.20",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 20 * DAY,
    mccCategory: "FOOD",
    merchantNameLocation: "LEON, LONDON",
    amount: "9.95",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 21 * DAY,
    mccCategory: "UTILITIES",
    merchantNameLocation: "VODAFONE UK, NEWBURY",
    amount: "22.00",
    status: "CONFIRMED",
    assets: [{ currency: "usdc", amount: "22.03" }],
  },
  {
    minutesAgo: 23 * DAY,
    mccCategory: "SUBSCRIPTIONS",
    merchantNameLocation: "GITHUB.COM, SAN FRANCISCO",
    amount: "3.80",
    status: "CONFIRMED",
    abroad: { currency: "USD", amount: "4.00", rate: "0.9500" },
  },
  {
    minutesAgo: 25 * DAY,
    mccCategory: "TRAVEL",
    merchantNameLocation: "EUROSTAR, LONDON",
    amount: "118.00",
    status: "CONFIRMED",
    assets: [{ currency: "eth", amount: "0.0354" }],
  },
  {
    minutesAgo: 27 * DAY,
    mccCategory: "FOOD",
    merchantNameLocation: "MARKS AND SPENCER, LONDON",
    amount: "18.74",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 29 * DAY,
    mccCategory: "ENTERTAINMENT",
    merchantNameLocation: "NINTENDO ESHOP, FRANKFURT",
    amount: "49.99",
    status: "REVERTED",
  },
  {
    minutesAgo: 31 * DAY,
    mccCategory: "ATM",
    merchantNameLocation: "ATM WITHDRAWAL, LONDON",
    amount: "80.00",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 34 * DAY,
    mccCategory: "HEALTH",
    merchantNameLocation: "BUPA DENTAL, LONDON",
    amount: "95.00",
    status: "CONFIRMED",
    assets: [
      { currency: "usdc", amount: "95.12" },
      { currency: "btc", amount: "0.00004" },
    ],
  },
  {
    minutesAgo: 37 * DAY,
    mccCategory: "MISC",
    merchantNameLocation: "IKEA, WEMBLEY",
    amount: "143.60",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 40 * DAY,
    mccCategory: "UTILITIES",
    merchantNameLocation: "OCTOPUS ENERGY, LONDON",
    amount: "64.18",
    status: "CONFIRMED",
  },
  {
    minutesAgo: 43 * DAY,
    mccCategory: "SUBSCRIPTIONS",
    merchantNameLocation: "NETFLIX.COM, LOS GATOS",
    amount: "12.99",
    status: "CONFIRMED",
  },
];

/** A charge settles to its reward within the week, so anything older has already been paid out. */
const CASHBACK_CLAIMED_AFTER = 7 * DAY;

/**
 * The reward a charge carries, across every state the provider sends one in.
 *
 * A declined charge carries no cashback at all, which is the case the optional field exists for.
 * A reverted one carries `NOT_EARNED` and a charge still settling carries `PENDING`, both with
 * their amounts at zero, as the provider sends them.
 */
function historyCashback(entry: HistoryEntry) {
  if (entry.status === "DECLINED") {
    return undefined;
  }

  const earned = mockCashback(entry.amount);

  if (entry.status === "REVERTED" || entry.status === "PENDING") {
    return {
      ...earned,
      amount: "0.000000",
      fiatAmount: "0.00",
      status: entry.status === "REVERTED" ? ("NOT_EARNED" as const) : ("PENDING" as const),
    };
  }

  return {
    ...earned,
    status: entry.minutesAgo > CASHBACK_CLAIMED_AFTER ? ("CLAIMED" as const) : ("EARNED" as const),
  };
}

function historyTransaction(entry: HistoryEntry, index: number, now: number) {
  const { abroad, assets, declineReason, merchantNameLocation, mccCategory, amount, status } =
    entry;
  const sign = entry.sign ?? "DEBIT";
  const dateTime = new Date(now - entry.minutesAgo * 60_000).toISOString();
  const fundingSources = status === "DECLINED" ? [] : (assets ?? [{ currency: "usdc", amount }]);

  return {
    ...documentedPayCardTransaction,
    id: `100a99cf-f4d3-4fa1-9be9-2e9828b2${String(index).padStart(4, "0")}`,
    // Set here rather than inherited: the spread would give all forty the documented charge's own
    // cashback, at one status, on the declined and reverted ones too.
    cashback: historyCashback(entry),
    transactionId: `11223344${String(70000 + index)}`,
    dateTime,
    sign,
    merchantNameLocation,
    mccCategory,
    status,
    declineReason: declineReason ?? "",
    transactionCurrency: "EUR",
    amountInTransactionCurrency: amount,
    originalCurrency: abroad?.currency ?? "EUR",
    amountInOriginalCurrency: abroad?.amount ?? amount,
    billingConversionRate: abroad?.rate ?? "1",
    ecbRate: abroad?.rate ?? "1",
    fundingSources: fundingSources.map(source => ({
      ...documentedPayCardTransaction.fundingSources[0],
      ...source,
      sign,
      status,
      dateTime,
    })),
  };
}

/**
 * The history the apps' MSW workers serve: forty charges over the last six weeks, newest first.
 *
 * Dated relative to `now` rather than fixed, so "Today" and "Yesterday" keep rendering however long
 * this fixture lives, and so the list never looks like it stopped in 2024.
 *
 * Separate from {@link mockPayCardTransactions}, which stays one-per-category and fixed because
 * tests in four packages assert against it.
 */
export function mockPayCardTransactionsHistory(now: Date = new Date()) {
  const at = now.getTime();

  return MOCK_HISTORY.map((entry, index) => historyTransaction(entry, index, at));
}
