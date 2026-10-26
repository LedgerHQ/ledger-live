import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { accountPortfolioApi, MAX_BALANCE_PAGES } from "./api";
import {
  balanceUrl,
  makePortfolioStore,
  MOCK_EVM_ADDRESS,
  MOCK_XPUB,
  mockBalanceGroup,
  mockPortfolio,
  portfolioUrl,
  registrationsUrl,
  type PortfolioEndpoint,
} from "./portfolioApi.mock";

const evmEntry = { id: "r-eth", type: "evm", address: MOCK_EVM_ADDRESS };

const endpoints = {
  read: jest.fn() as PortfolioEndpoint,
  create: jest.fn() as PortfolioEndpoint,
  add: jest.fn() as PortfolioEndpoint,
  remove: jest.fn() as PortfolioEndpoint,
  balance: jest.fn() as PortfolioEndpoint,
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

beforeEach(() => {
  endpoints.read.mockReset().mockImplementation(() => HttpResponse.json(mockPortfolio()));
  endpoints.create.mockReset().mockImplementation(() => HttpResponse.json(mockPortfolio()));
  endpoints.add.mockReset().mockImplementation(() => HttpResponse.json(mockPortfolio()));
  endpoints.remove.mockReset().mockImplementation(() => HttpResponse.json(mockPortfolio()));
  endpoints.balance
    .mockReset()
    .mockImplementation(() => HttpResponse.json({ items: [], nextToken: null }));
  server.resetHandlers(
    http.get(portfolioUrl("p1"), endpoints.read),
    http.put(portfolioUrl("p1"), endpoints.create),
    http.post(registrationsUrl("p1"), endpoints.add),
    http.delete(registrationsUrl("p1"), endpoints.remove),
    http.get(balanceUrl("p1"), endpoints.balance),
  );
});

const bodyOf = async (endpoint: PortfolioEndpoint) =>
  endpoint.mock.calls[0]?.[0].request.clone().json();

const sync = (
  registrations: Parameters<
    typeof accountPortfolioApi.endpoints.syncPortfolio.initiate
  >[0]["registrations"],
) =>
  makePortfolioStore().dispatch(
    accountPortfolioApi.endpoints.syncPortfolio.initiate({ portfolioId: "p1", registrations }),
  );

describe("syncPortfolio", () => {
  it("should create the portfolio and register the accounts when it is missing", async () => {
    endpoints.read.mockImplementationOnce(() => HttpResponse.json({}, { status: 404 }));
    endpoints.add.mockImplementation(() =>
      HttpResponse.json(mockPortfolio({ registrations: [evmEntry] })),
    );

    const portfolio = await sync([{ type: "evm", address: MOCK_EVM_ADDRESS }]).unwrap();

    expect(endpoints.create).toHaveBeenCalledTimes(1);
    expect(await bodyOf(endpoints.add)).toEqual([{ type: "evm", address: MOCK_EVM_ADDRESS }]);
    expect(portfolio.registrations).toEqual([evmEntry]);
  });

  it("should reuse the portfolio when the service says it already exists", async () => {
    endpoints.read.mockImplementationOnce(() => HttpResponse.json({}, { status: 404 }));
    endpoints.create.mockImplementation(() =>
      HttpResponse.json(
        { details: "duplicate key value violates portfolio_pkey" },
        { status: 500 },
      ),
    );

    const result = await sync([]);

    expect(result.error).toBeUndefined();
    expect(endpoints.read).toHaveBeenCalledTimes(2);
  });

  it("should not register again what the portfolio already has", async () => {
    endpoints.read.mockImplementation(() =>
      HttpResponse.json(mockPortfolio({ registrations: [evmEntry] })),
    );

    await sync([{ type: "evm", address: MOCK_EVM_ADDRESS }]).unwrap();

    expect(endpoints.add).not.toHaveBeenCalled();
    expect(endpoints.remove).not.toHaveBeenCalled();
  });

  it("should remove the registrations of accounts the wallet no longer has", async () => {
    endpoints.read.mockImplementation(() =>
      HttpResponse.json(
        mockPortfolio({
          registrations: [
            { id: "r-btc", type: "auto_derive", network: "bitcoin", xpub: MOCK_XPUB },
            evmEntry,
          ],
        }),
      ),
    );

    await sync([{ type: "evm", address: MOCK_EVM_ADDRESS }]).unwrap();

    expect(await bodyOf(endpoints.remove)).toEqual(["r-btc"]);
    expect(endpoints.add).not.toHaveBeenCalled();
  });

  it("should fail when the service refuses the registrations", async () => {
    endpoints.add.mockImplementation(() =>
      HttpResponse.json({ details: "bad xpub" }, { status: 400 }),
    );

    const result = await sync([{ type: "evm", address: MOCK_EVM_ADDRESS }]);

    expect(result.error).toMatchObject({ status: 400 });
  });
});

describe("getBalanceSnapshot", () => {
  const read = (currency?: string) =>
    makePortfolioStore().dispatch(
      accountPortfolioApi.endpoints.getBalanceSnapshot.initiate({ portfolioId: "p1", currency }),
    );

  it("should read every page in the requested currency", async () => {
    endpoints.balance
      .mockImplementationOnce(() =>
        HttpResponse.json({ items: [mockBalanceGroup("a1")], nextToken: "t1" }),
      )
      .mockImplementationOnce(() =>
        HttpResponse.json({ items: [mockBalanceGroup("a2")], nextToken: null }),
      );

    const snapshot = await read("EUR").unwrap();

    expect(snapshot.currency).toBe("EUR");
    expect(snapshot.items.map(group => group.account_id)).toEqual(["a1", "a2"]);
    const secondUrl = new URL(endpoints.balance.mock.calls[1]?.[0].request.url ?? "");
    expect(secondUrl.searchParams.get("token")).toBe("t1");
    expect(secondUrl.searchParams.get("currency")).toBe("EUR");
  });

  it("should refuse a partial balance when the service keeps paginating", async () => {
    let page = 0;
    endpoints.balance.mockImplementation(() => {
      page += 1;
      return HttpResponse.json({ items: [mockBalanceGroup(`a${page}`)], nextToken: `t${page}` });
    });

    const result = await read();

    expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
    expect(endpoints.balance).toHaveBeenCalledTimes(MAX_BALANCE_PAGES);
  });

  it("should refuse a balance whose pages loop", async () => {
    endpoints.balance.mockImplementation(() =>
      HttpResponse.json({ items: [mockBalanceGroup("a1")], nextToken: "same" }),
    );

    const result = await read();

    expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
    expect(endpoints.balance).toHaveBeenCalledTimes(2);
  });
});
