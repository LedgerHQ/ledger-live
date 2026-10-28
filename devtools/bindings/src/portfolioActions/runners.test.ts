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
    token: cryptoAssetsApi.endpoints.findTokenByAddressInCurrency.initiate,
  };
  afterEach(() => {
    Object.assign(accountPortfolioApi.endpoints.getBalanceHistory, { initiate: original.history });
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

    it("keeps the asset as sent when CAL fails", async () => {
      stubEndpoint(accountPortfolioApi.endpoints.getBalanceHistory, { items: [point] });
      stubEndpoint(cryptoAssetsApi.endpoints.findTokenByAddressInCurrency, new Error("CAL down"));
      const { view } = await run("getBalanceHistory", request());
      if (view.kind !== "history") throw new Error("not a history");
      expect(view.points[0].ticker).toBeUndefined();
    });
  });
});
