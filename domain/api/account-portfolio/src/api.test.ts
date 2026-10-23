import { configureStore } from "@reduxjs/toolkit";
import { portfolioApi, portfolioApiExtra } from "@shared/api-services";
import { accountPortfolioApi } from "./api";

const updateView = {
  network: "ethereum",
  account_id: "acc-1",
  time: "2025-01-01T00:00:00Z",
  block: { hash: "0xb", height: 1, time: "2025-01-01T00:00:00Z" },
  tx: { hash: "0xt", index: 0 },
  failed: false,
  deltas: [
    {
      asset: "ethereum",
      cal_id: "cal-eth",
      name: "Ether",
      ticker: "ETH",
      decimals: 18,
      amount: "-1000",
      currency_value: 2.5,
    },
  ],
  fee: { asset: "ethereum", amount: "21", currency_value: null },
  events: {},
  parts: null,
};

describe("accountPortfolioApi", () => {
  let fetchSpy: jest.SpyInstance;

  const makeStore = (url = "https://portfolio.test") =>
    configureStore({
      reducer: { [portfolioApi.reducerPath]: portfolioApi.reducer },
      middleware: gdm =>
        gdm({ thunk: { extraArgument: portfolioApiExtra({ portfolioServiceUrl: url }) } }).concat(
          portfolioApi.middleware,
        ),
    });

  const respond = (body: unknown, status = 200) => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };

  const requestUrl = () => new URL((fetchSpy.mock.calls[0][0] as Request).url);

  afterEach(() => {
    fetchSpy?.mockRestore();
    jest.restoreAllMocks();
  });

  it("reads updates with the account and currency filters, and validates the page", async () => {
    respond({ items: [updateView], nextToken: null });
    const store = makeStore();

    const page = await store
      .dispatch(
        accountPortfolioApi.endpoints.getUpdates.initiate({
          portfolioId: "p1",
          account: "acc-1",
          currency: "eur",
        }),
      )
      .unwrap();

    expect(requestUrl().pathname).toBe("/v1/portfolio/p1/updates");
    expect(requestUrl().searchParams.get("account")).toBe("acc-1");
    expect(requestUrl().searchParams.get("currency")).toBe("eur");
    expect(requestUrl().searchParams.has("portfolioId")).toBe(false);
    expect(page.items[0].deltas?.[0].currency_value).toBe(2.5);
  });

  it("keeps the payload, the HTTP status and the schema issues when the contract drifts", async () => {
    const body = { items: [{ ...updateView, failed: "no" }] };
    respond(body);
    const result = await makeStore().dispatch(
      accountPortfolioApi.endpoints.getUpdates.initiate({ portfolioId: "p1" }),
    );
    expect(result.error).toMatchObject({ status: 200, data: body, issues: expect.any(Array) });
  });

  it("reads a balance grouped per account, with the entries and the accounts that failed", async () => {
    const entry = (status: "confirmed" | "pending") => ({
      network: "adi",
      account_id: "adi:0x4bc1",
      asset: "native",
      cal_id: "adi",
      name: "ADI",
      ticker: "ADI",
      decimals: 18,
      amount: "0",
      currency_value: 0,
      estimated: false,
      status,
      locked: false,
      stake: null,
    });
    respond({
      items: [
        {
          network: "adi",
          account_id: "adi:0x4bc1",
          items: [entry("confirmed"), entry("pending")],
          type: "success",
        },
        { network: "tron", account_id: "tron:T1", error: "node unreachable", type: "failure" },
      ],
      nextToken: "next",
    });

    const page = await makeStore()
      .dispatch(accountPortfolioApi.endpoints.getBalance.initiate({ portfolioId: "p1" }))
      .unwrap();

    expect(requestUrl().pathname).toBe("/v1/portfolio/p1/balance");
    expect(page.nextToken).toBe("next");
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toMatchObject({ type: "success" });
    expect(page.items[1]).toMatchObject({ error: "node unreachable" });
  });

  it("creates a portfolio with PUT", async () => {
    respond({ id: "p1" }, 201);
    await makeStore()
      .dispatch(accountPortfolioApi.endpoints.createPortfolio.initiate({ portfolioId: "p1" }))
      .unwrap();
    expect((fetchSpy.mock.calls[0][0] as Request).method).toBe("PUT");
    expect(requestUrl().pathname).toBe("/v1/portfolio/p1");
  });

  it("posts registrations as the body", async () => {
    respond({ id: "p1", accounts: [{ id: "a", network: "ethereum", status: "uninitialized" }] });
    const registrations = [{ type: "evm" as const, address: "0xabc" }];
    await makeStore()
      .dispatch(
        accountPortfolioApi.endpoints.addRegistrations.initiate({
          portfolioId: "p1",
          registrations,
        }),
      )
      .unwrap();
    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.method).toBe("POST");
    expect(await request.json()).toEqual(registrations);
  });

  it("removes registrations by id, with DELETE and the ids as the body", async () => {
    respond({ id: "p1", registrations: [] });
    const ids = ["061e3caf-1431-4979-8852-e6e91ad5498a"];

    await makeStore()
      .dispatch(
        accountPortfolioApi.endpoints.removeRegistrations.initiate({
          portfolioId: "p1",
          registrationIds: ids,
        }),
      )
      .unwrap();

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.method).toBe("DELETE");
    expect(requestUrl().pathname).toBe("/v1/portfolio/p1/registrations");
    expect(await request.json()).toEqual(ids);
  });

  it("adds addresses to an account of the portfolio, as an account update", async () => {
    respond({ id: "base:0xabc", network: "base", status: "synchronized" });

    const account = await makeStore()
      .dispatch(
        accountPortfolioApi.endpoints.addAddresses.initiate({
          portfolioId: "p1",
          accountId: "base:0xabc",
          addresses: ["0x1", "0x2"],
        }),
      )
      .unwrap();

    const request = fetchSpy.mock.calls[0][0] as Request;
    expect(request.method).toBe("POST");
    expect(requestUrl().pathname).toBe("/v1/portfolio/p1/accounts/base%3A0xabc/addresses");
    expect(await request.json()).toEqual({ type: "account", addresses: ["0x1", "0x2"] });
    expect(account.status).toBe("synchronized");
  });

  it("reads the balance history per account, with the range", async () => {
    respond({
      items: [
        {
          type: "success",
          network: "ethereum",
          account_id: "ethereum:0xabc",
          items: [
            {
              network: "ethereum",
              account_id: "ethereum:0xabc",
              asset: "native",
              cal_id: "ethereum",
              name: "Ethereum",
              ticker: "ETH",
              decimals: 18,
              time: "2026-01-01T00:00:00Z",
              value: "1000000000000000000",
              currency_value: 2500.5,
            },
          ],
        },
      ],
      nextToken: null,
    });

    const page = await makeStore()
      .dispatch(
        accountPortfolioApi.endpoints.getBalanceHistory.initiate({
          portfolioId: "p1",
          range: "week",
          currency: "usd",
        }),
      )
      .unwrap();

    expect(requestUrl().pathname).toBe("/v1/portfolio/p1/balance/history");
    expect(requestUrl().searchParams.get("range")).toBe("week");
    expect(page.items).toHaveLength(1);
  });

  it("fails without a request when the service url is empty", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch");
    const result = await makeStore("").dispatch(
      accountPortfolioApi.endpoints.getPortfolio.initiate({ portfolioId: "p1" }),
    );
    expect(result.isError).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
