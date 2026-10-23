import { accountPortfolioApi } from "@domain/api-account-portfolio";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { RUNNERS, type PortfolioDispatch } from "./runners";
import type { PortfolioRequest } from "./types";

const request = (overrides: Partial<PortfolioRequest> = {}): PortfolioRequest => ({
  action: "getBalanceHistory",
  portfolioId: "p",
  currency: "usd",
  ...overrides,
});

/** `initiate` is replaced by a marker the fake dispatch answers, so no store nor network runs. */
function stubEndpoint(endpoint: { initiate: unknown }, answer: unknown) {
  const initiate = jest.fn((args: unknown) => ({ args, answer }));
  Object.assign(endpoint, { initiate });
  return initiate;
}

const dispatch = ((marker: { answer: unknown }) => ({
  unwrap: async () => {
    if (marker.answer instanceof Error) throw marker.answer;
    return marker.answer;
  },
})) as unknown as PortfolioDispatch;

const run = (action: keyof typeof RUNNERS, req: PortfolioRequest) =>
  RUNNERS[action]({ dispatch, request: req, payload: undefined });

const erc20 = "erc20.0x" + "a".repeat(40);
const point = {
  type: "success",
  network: "base",
  account_id: "a",
  items: [
    {
      network: "base",
      account_id: "a",
      asset: erc20,
      amount: "1",
      value: "1",
      time: "t",
      cal_id: null,
      ticker: null,
      name: null,
      decimals: null,
      currency_value: null,
    },
  ],
};

describe("RUNNERS", () => {
  const original = {
    history: accountPortfolioApi.endpoints.getBalanceHistory.initiate,
    balance: accountPortfolioApi.endpoints.getBalance.initiate,
    token: cryptoAssetsApi.endpoints.findTokenByAddressInCurrency.initiate,
  };
  afterEach(() => {
    Object.assign(accountPortfolioApi.endpoints.getBalanceHistory, { initiate: original.history });
    Object.assign(accountPortfolioApi.endpoints.getBalance, { initiate: original.balance });
    Object.assign(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency, {
      initiate: original.token,
    });
  });

  describe("getBalanceHistory", () => {
    it.each([
      ["week", "week"],
      ["decade", undefined],
    ])("asks the range %s as %s", async (range, expected) => {
      const initiate = stubEndpoint(accountPortfolioApi.endpoints.getBalanceHistory, {
        items: [],
        nextToken: null,
      });
      stubEndpoint(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency, undefined);
      await run("getBalanceHistory", request({ range }));
      expect(initiate.mock.calls[0][0]).toMatchObject({ range: expected });
    });

    it("sends the page token, and none when it is empty", async () => {
      const initiate = stubEndpoint(accountPortfolioApi.endpoints.getBalanceHistory, {
        items: [],
      });
      await run("getBalanceHistory", request({ pageToken: "abc" }));
      await run("getBalanceHistory", request({ pageToken: "" }));
      expect(initiate.mock.calls[0][0]).toMatchObject({ token: "abc" });
      expect(initiate.mock.calls[1][0]).toMatchObject({ token: undefined });
    });

    it("completes an unknown token with what CAL answers", async () => {
      stubEndpoint(accountPortfolioApi.endpoints.getBalanceHistory, { items: [point] });
      stubEndpoint(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency, {
        id: "cal-id",
        ticker: "TKN",
        name: "Token",
        units: [{ magnitude: 6 }],
      });
      const { view } = await run("getBalanceHistory", request());
      if (view.kind !== "history") throw new Error("not a history");
      expect(view.points[0]).toMatchObject({ calId: "cal-id", ticker: "TKN", decimals: 6 });
    });

    it("keeps the asset as sent when CAL does not know it, or fails", async () => {
      stubEndpoint(accountPortfolioApi.endpoints.getBalanceHistory, { items: [point] });
      for (const answer of [undefined, new Error("CAL down")]) {
        stubEndpoint(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency, answer);
        const { view } = await run("getBalanceHistory", request());
        if (view.kind !== "history") throw new Error("not a history");
        expect(view.points[0].ticker).toBeUndefined();
      }
    });

    it("leaves a token without unit unresolved instead of failing", async () => {
      stubEndpoint(accountPortfolioApi.endpoints.getBalanceHistory, { items: [point] });
      stubEndpoint(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency, {
        id: "cal-id",
        ticker: "TKN",
        name: "Token",
        units: [],
      });
      const { view } = await run("getBalanceHistory", request());
      if (view.kind !== "history") throw new Error("not a history");
      expect(view.points[0].ticker).toBeUndefined();
    });

    it("rejects when the service does", async () => {
      stubEndpoint(accountPortfolioApi.endpoints.getBalanceHistory, new Error("500"));
      await expect(run("getBalanceHistory", request())).rejects.toThrow("500");
    });
  });

  describe("getBalance", () => {
    it("sends the page token it was given", async () => {
      const initiate = stubEndpoint(accountPortfolioApi.endpoints.getBalance, { items: [] });
      await run("getBalance", request({ action: "getBalance", pageToken: "abc" }));
      expect(initiate.mock.calls[0][0]).toMatchObject({ token: "abc" });
    });

    it("reduces the page to a balance view that has more when the service gave a token", async () => {
      stubEndpoint(accountPortfolioApi.endpoints.getBalance, { items: [], nextToken: "n" });
      const { view } = await run("getBalance", request({ action: "getBalance" }));
      expect(view).toMatchObject({ kind: "balance", hasMore: true });
    });
  });
});
