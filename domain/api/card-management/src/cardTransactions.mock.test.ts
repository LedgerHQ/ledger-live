import { PAY_CARD_TRANSACTION_CATEGORIES, PayCardTransactionsResponseSchema } from "./schema";
import {
  clearPayCardTransactionsMock,
  documentedPayCardTransaction,
  emptyPayCardTransactionsMock,
  fillPayCardTransactionsMock,
  MOCK_CARD_TRANSACTIONS_PAGE_SIZE,
  mockPayCardTransactions,
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
  const pageRequest = (page: string) =>
    new Request(`https://card.test/v1/card/transactions?page=${page}`);

  it("serves the first page to a caller that asks for page 0", () => {
    const page = mockPayCardTransactionsPage(pageRequest("0"));

    expect(page).toHaveLength(MOCK_CARD_TRANSACTIONS_PAGE_SIZE);
    expect(page).toEqual(mockPayCardTransactions().slice(0, MOCK_CARD_TRANSACTIONS_PAGE_SIZE));
  });

  it("walks the whole history in pages, without repeating or dropping a transaction", () => {
    const all = mockPayCardTransactions();
    const pageCount = Math.ceil(all.length / MOCK_CARD_TRANSACTIONS_PAGE_SIZE);
    const walked = Array.from({ length: pageCount }, (_, page) =>
      mockPayCardTransactionsPage(pageRequest(String(page))),
    ).flat();

    expect(walked).toEqual(all);
  });

  it("ends on a short page, which is how a caller learns the history stopped", () => {
    const all = mockPayCardTransactions();
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
