import { PAY_CARD_TRANSACTION_CATEGORIES, PayCardTransactionsResponseSchema } from "./schema";
import {
  clearPayCardTransactionsMock,
  documentedPayCardTransaction,
  emptyPayCardTransactionsMock,
  fillPayCardTransactionsMock,
  MOCK_CARD_TRANSACTIONS_PAGE_SIZE,
  mockPayCardTransactions,
  mockPayCardTransactionsHistory,
  mockPayCardTransactionsPage,
  readPayCardTransactionsMock,
  receiveMultiAssetPayCardTransactionMock,
  receivePayCardTransactionMock,
} from "./cardTransactions.mock";

describe("mockPayCardTransactions", () => {
  afterEach(clearPayCardTransactionsMock);

  it("answers a page the transaction schema accepts", () => {
    expect(PayCardTransactionsResponseSchema.parse(mockPayCardTransactions())).toHaveLength(
      PAY_CARD_TRANSACTION_CATEGORIES.length,
    );
  });

  it("covers every spend category, so each one can be seen in a list", () => {
    const categories = mockPayCardTransactions().map(({ mccCategory }) => mccCategory);

    expect([...categories].sort()).toEqual([...PAY_CARD_TRANSACTION_CATEGORIES].sort());
  });

  it("can hold empty and full endpoint answers for QA", () => {
    emptyPayCardTransactionsMock();
    expect(readPayCardTransactionsMock()).toEqual([]);

    fillPayCardTransactionsMock();
    expect(readPayCardTransactionsMock()).toHaveLength(mockPayCardTransactions().length);

    clearPayCardTransactionsMock();
    expect(readPayCardTransactionsMock()).toBeUndefined();
  });

  it("receives newest transactions scoped to the selected funding asset", () => {
    receivePayCardTransactionMock("usdc");
    receivePayCardTransactionMock("btc");

    const mocked = readPayCardTransactionsMock();
    expect(mocked).toHaveLength(2);
    expect(
      mocked?.map(transaction => (transaction.fundingSources ?? []).map(source => source.currency)),
    ).toEqual([["btc"], ["usdc"]]);
    expect(mocked?.[0]?.id).toMatch(/^devtool-btc-/);
  });

  it("receives a newest transaction keeping every asset that funded it", () => {
    receiveMultiAssetPayCardTransactionMock();

    const received = readPayCardTransactionsMock()?.[0];

    const template = mockPayCardTransactions().find(
      ({ fundingSources }) => fundingSources.length > 1,
    );

    expect(received?.id).toMatch(/^devtool-multi-/);
    expect(received?.fundingSources?.map(({ currency }) => currency)).toEqual(
      template?.fundingSources.map(({ currency }) => currency),
    );
  });

  it("funds one charge with several assets, one of them carrying more digits than a row shows", () => {
    const multiAsset = mockPayCardTransactions().filter(
      ({ fundingSources }) => fundingSources.length > 1,
    );

    expect(multiAsset.length).toBeGreaterThan(0);
    expect(
      multiAsset.some(({ fundingSources }) =>
        fundingSources.some(({ amount }) => (amount.split(".")[1]?.length ?? 0) > 8),
      ),
    ).toBe(true);
  });

  it("covers different fiat and funding asset amounts for visual testing", () => {
    const transactions = mockPayCardTransactions();
    const fiatAmounts = new Set(
      transactions.map(({ amountInTransactionCurrency }) => amountInTransactionCurrency),
    );
    const assetCurrencies = new Set(
      transactions.flatMap(({ fundingSources }) =>
        fundingSources.map(({ currency }) => currency.toUpperCase()),
      ),
    );

    expect(fiatAmounts.size).toBeGreaterThan(1);
    expect(assetCurrencies).toEqual(new Set(["USDC", "BTC", "ETH"]));
    expect(transactions.some(({ fundingSources }) => fundingSources.length > 1)).toBe(true);
  });

  it("covers every status, so each one can be seen in a list", () => {
    const statuses = mockPayCardTransactions().map(({ status }) => status);

    expect(new Set(statuses)).toEqual(new Set(["CONFIRMED", "PENDING", "DECLINED", "REVERTED"]));
  });

  it("explains why the declined one was declined", () => {
    const declined = mockPayCardTransactions().filter(({ status }) => status === "DECLINED");

    expect(declined).toHaveLength(1);
    expect(declined[0].declineReason).not.toBe("");
  });

  it("pairs every settled charge with the cashback it earned", () => {
    const settled = mockPayCardTransactions().filter(
      ({ status }) => status !== "DECLINED" && status !== "REVERTED",
    );

    expect(settled.length).toBeGreaterThan(1);
    for (const { cashback } of settled) {
      expect(cashback).toMatchObject({ currency: "BXX", status: "EARNED" });
      expect(Number(cashback?.amount)).toBeGreaterThan(0);
      expect(Number(cashback?.fiatAmount)).toBeGreaterThan(0);
    }
  });

  it("leaves a charge that never settled without a cashback", () => {
    const unearned = mockPayCardTransactions().filter(
      ({ status }) => status === "DECLINED" || status === "REVERTED",
    );

    expect(unearned).toHaveLength(2);
    expect(unearned.every(({ cashback }) => cashback === undefined)).toBe(true);
  });

  it("keeps the provider's documented charge as the miscellaneous one", () => {
    const misc = mockPayCardTransactions().find(({ mccCategory }) => mccCategory === "MISC");

    expect(misc).toEqual(documentedPayCardTransaction);
  });
});

describe("mockPayCardTransactionsPage", () => {
  // The history is dated relative to now, so two reads a millisecond apart would not compare equal.
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-04T09:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const pageRequest = (page: string) =>
    new Request(`https://card.test/v1/card/transactions?page=${page}`);

  it("serves the first page to a caller that asks for page 0", () => {
    const page = mockPayCardTransactionsPage(pageRequest("0"));

    expect(page).toHaveLength(MOCK_CARD_TRANSACTIONS_PAGE_SIZE);
    expect(page).toEqual(
      mockPayCardTransactionsHistory().slice(0, MOCK_CARD_TRANSACTIONS_PAGE_SIZE),
    );
  });

  it("walks the whole history in pages, without repeating or dropping a transaction", () => {
    const all = mockPayCardTransactionsHistory();
    const pageCount = Math.ceil(all.length / MOCK_CARD_TRANSACTIONS_PAGE_SIZE);
    const walked = Array.from({ length: pageCount }, (_, page) =>
      mockPayCardTransactionsPage(pageRequest(String(page))),
    ).flat();

    expect(walked).toEqual(all);
  });

  it("ends on a short page, which is how a caller learns the history stopped", () => {
    const all = mockPayCardTransactionsHistory();
    const lastPage = Math.ceil(all.length / MOCK_CARD_TRANSACTIONS_PAGE_SIZE) - 1;

    expect(mockPayCardTransactionsPage(pageRequest(String(lastPage))).length).toBeLessThan(
      MOCK_CARD_TRANSACTIONS_PAGE_SIZE,
    );
  });

  it("answers a page past the end with an empty array, which is what ends the reading", () => {
    expect(mockPayCardTransactionsPage(pageRequest("99"))).toEqual([]);
  });

  it.each(["-1", "", "nonsense"])(
    "falls back to page 0 for page %s, as the provider does when it is missing or not a number",
    page => {
      expect(mockPayCardTransactionsPage(pageRequest(page))).toEqual(
        mockPayCardTransactionsPage(pageRequest("0")),
      );
    },
  );
});

describe("mockPayCardTransactionsHistory", () => {
  const now = new Date("2026-03-04T09:00:00.000Z");

  it("pairs every settled charge with a cashback of its own size", () => {
    const settled = mockPayCardTransactionsHistory(now).filter(
      ({ status }) => status !== "DECLINED",
    );

    expect(settled.every(({ cashback }) => cashback !== undefined)).toBe(true);
    for (const { cashback } of settled) {
      expect(cashback).toMatchObject({ currency: "BXX" });
    }
  });

  it("carries every cashback state, so each treatment can be seen without a funded card", () => {
    const states = new Set(
      mockPayCardTransactionsHistory(now).map(({ cashback }) => cashback?.status ?? "none"),
    );

    expect(states).toEqual(new Set(["EARNED", "CLAIMED", "PENDING", "NOT_EARNED", "none"]));
  });

  it("zeroes the reward on a charge that has not settled into one", () => {
    // The provider sends both amounts as zero until the reward settles, and on one it never will.
    const unsettled = mockPayCardTransactionsHistory(now)
      .map(({ cashback }) => cashback)
      .filter(cashback => cashback?.status === "PENDING" || cashback?.status === "NOT_EARNED");

    expect(unsettled.length).toBeGreaterThan(0);
    for (const cashback of unsettled) {
      expect(cashback).toMatchObject({ amount: "0.000000", fiatAmount: "0.00" });
    }
  });

  it("scales the cashback with the charge rather than repeating the documented one", () => {
    // The builder spreads the documented transaction, which carries its own cashback. Without an
    // explicit one per row, all forty would report the same 0.01 EUR.
    const earned = new Set(
      mockPayCardTransactionsHistory(now)
        .map(({ cashback }) => cashback?.fiatAmount)
        .filter(Boolean),
    );

    expect(earned.size).toBeGreaterThan(1);
  });

  it("earns nothing at all on a charge the provider declined", () => {
    // The only rows with no cashback, which is what keeps the optional field exercised.
    expect(
      mockPayCardTransactionsHistory(now)
        .filter(({ cashback }) => cashback === undefined)
        .map(({ status }) => status),
    ).toEqual(["DECLINED", "DECLINED"]);
  });

  it("is a history the schema accepts, whole", () => {
    expect(
      PayCardTransactionsResponseSchema.parse(mockPayCardTransactionsHistory(now)),
    ).toHaveLength(mockPayCardTransactionsHistory(now).length);
  });

  it("holds enough charges to page through several times", () => {
    const pages = mockPayCardTransactionsHistory(now).length / MOCK_CARD_TRANSACTIONS_PAGE_SIZE;

    expect(pages).toBeGreaterThanOrEqual(4);
  });

  it("gives every transaction its own id", () => {
    const ids = mockPayCardTransactionsHistory(now).map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reads newest first, the order the provider sends", () => {
    const times = mockPayCardTransactionsHistory(now).map(({ dateTime }) => Date.parse(dateTime));

    expect(times).toEqual([...times].sort((left, right) => right - left));
  });

  it("dates itself against the moment it is asked, so today and yesterday keep rendering", () => {
    const [newest] = mockPayCardTransactionsHistory(now);
    const dayBefore = new Date(now).setDate(now.getDate() - 1);

    expect(Date.parse(newest.dateTime)).toBeLessThanOrEqual(now.getTime());
    expect(
      mockPayCardTransactionsHistory(now).some(({ dateTime }) => {
        const at = Date.parse(dateTime);
        return at <= now.getTime() && at > dayBefore;
      }),
    ).toBe(true);
  });

  it("shows every status the detail sheet can badge", () => {
    const statuses = new Set(mockPayCardTransactionsHistory(now).map(({ status }) => status));

    expect(statuses).toEqual(new Set(["CONFIRMED", "PENDING", "DECLINED", "REVERTED"]));
  });

  it("gives a declined charge its reason, and a settled one none", () => {
    const history = mockPayCardTransactionsHistory(now);
    const declined = history.filter(({ status }) => status === "DECLINED");

    expect(declined.length).toBeGreaterThan(0);
    expect(declined.every(({ declineReason }) => declineReason !== "")).toBe(true);
    expect(
      history
        .filter(({ status }) => status === "CONFIRMED")
        .every(({ declineReason }) => declineReason === ""),
    ).toBe(true);
  });

  it("has a refund, so the list is not all debits", () => {
    expect(mockPayCardTransactionsHistory(now).some(({ sign }) => sign === "CREDIT")).toBe(true);
  });

  it("charges some purchases abroad, where the merchant's currency is not the card's", () => {
    const abroad = mockPayCardTransactionsHistory(now).filter(
      ({ originalCurrency, transactionCurrency }) => originalCurrency !== transactionCurrency,
    );

    expect(abroad.length).toBeGreaterThan(0);
    expect(abroad.every(({ billingConversionRate }) => billingConversionRate !== "1")).toBe(true);
  });

  it("pays some charges from more than one wallet", () => {
    expect(
      mockPayCardTransactionsHistory(now).some(({ fundingSources }) => fundingSources.length > 1),
    ).toBe(true);
  });

  it("funds nothing for a charge the provider declined", () => {
    expect(
      mockPayCardTransactionsHistory(now)
        .filter(({ status }) => status === "DECLINED")
        .every(({ fundingSources }) => fundingSources.length === 0),
    ).toBe(true);
  });
});
