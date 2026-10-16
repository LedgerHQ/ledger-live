import {
  createMemoryHistoryStore,
  createMemoryStateStore,
} from "@ledgerhq/account-module-framework";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import {
  ADDRESS,
  fakeAccountModule,
  fakeBinding,
  fakeCoinModule,
  mockLiveConfig,
  portfolioCoinConfig,
  ripple,
  bitcoin,
  type FakeCoinModule,
} from "../tests/portfolioFixtures";
import {
  accountModuleOf,
  localNetworkOf,
  memoisedTokenLookup,
  localModeRemote,
  openNetworkPortfolio,
  portfolioSides,
  unavailablePortfolio,
  type PortfolioDeps,
} from "./network";

jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));

const context = { config: async () => ({}), logger: () => undefined } as never;
const token = {
  id: "ripple/token/usd",
  name: "US Dollar",
  ticker: "USD",
  units: [{ magnitude: 2 }],
};
const usd = { type: "token", assetReference: "USD.rIssuer" };

let coinModule: FakeCoinModule;

const deps = (fields: Partial<PortfolioDeps> = {}): PortfolioDeps => ({
  binding: undefined,
  coinModuleApi: coinModule as never,
  context,
  bridgeApi: {},
  ...fields,
});

function configure(mode: "local" | "hybrid" | "remote", url = "https://portfolio.test"): void {
  mockLiveConfig({
    config_portfolio_service: { url },
    config_currency_ripple: portfolioCoinConfig(mode),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  coinModule = fakeCoinModule();
});

afterEach(() => jest.restoreAllMocks());

describe("unavailablePortfolio", () => {
  it("holds no portfolio", async () => {
    await expect(unavailablePortfolio.getPortfolio("p")).rejects.toMatchObject({
      name: "PortfolioApiError",
      type: "NOT_FOUND",
      message: expect.stringContaining("no portfolio-service url"),
    });
  });

  it("fails every other call with UNAVAILABLE, and serves no network", async () => {
    const calls = Object.entries(unavailablePortfolio).filter(
      ([name]) => name !== "listNetworks" && name !== "getPortfolio",
    );
    expect(calls).toHaveLength(15);
    for (const [, call] of calls) {
      await expect((call as () => Promise<unknown>)()).rejects.toMatchObject({
        name: "PortfolioApiError",
        type: "UNAVAILABLE",
        message: expect.stringContaining("config_portfolio_service.url"),
      });
    }
    await expect(unavailablePortfolio.listNetworks()).resolves.toEqual([]);
  });
});

describe("localModeRemote", () => {
  it("holds no portfolio and serves nothing else, saying the chain is in local mode", async () => {
    await expect(localModeRemote.getPortfolio("p")).rejects.toMatchObject({
      type: "NOT_FOUND",
      message: "Portfolio p not found: the chain is in local mode",
    });
    expect(localModeRemote.getChangeAddress).toBeUndefined();
    await expect(localModeRemote.addRegistrations("p", [])).rejects.toMatchObject({
      type: "UNAVAILABLE",
      message: expect.stringContaining("local mode"),
    });
    await expect(localModeRemote.listNetworks()).resolves.toEqual([]);
  });
});

describe("memoisedTokenLookup", () => {
  it("is none without a lookup", () => {
    expect(memoisedTokenLookup(undefined)).toBeUndefined();
  });

  it("asks the lookup once per type, reference and issuer", async () => {
    const lookup = jest.fn(async () => token as never);
    const memoised = memoisedTokenLookup(lookup);

    await expect(memoised?.(usd)).resolves.toBe(token);
    await expect(memoised?.({ ...usd, name: "renamed" } as never)).resolves.toBe(token);
    await memoised?.({ ...usd, assetOwner: "rIssuer" });
    await memoised?.({ type: "native" });

    expect(lookup.mock.calls).toEqual([
      [usd],
      [{ ...usd, assetOwner: "rIssuer" }],
      [{ type: "native" }],
    ]);
  });
});

describe("accountModuleOf", () => {
  it("is the binding's account module", () => {
    const module = fakeAccountModule();
    const binding = fakeBinding(module);
    expect(accountModuleOf(bitcoin, deps({ binding }))).toBe(module);
    expect(binding.create).toHaveBeenCalledWith(coinModule, "bitcoin");
  });

  it("is the single-address module on the coin module, handed the family's balance options", async () => {
    const balanceOptions = { includeAssets: async () => true };
    const data = {
      descriptor: {
        currencyId: "ripple",
        derivationMode: "",
        index: 0,
        key: ADDRESS,
        derivationPath: "",
      },
      state: createMemoryStateStore(),
      history: createMemoryHistoryStore([]),
    };

    for await (const _ of accountModuleOf(ripple, deps({ bridgeApi: { balanceOptions } })).sync(
      context,
      data,
    )) {
      // drained
    }
    expect(coinModule.getBalance).toHaveBeenLastCalledWith(context, ADDRESS, balanceOptions);

    for await (const _ of accountModuleOf(ripple, deps()).sync(context, data)) {
      // drained
    }
    expect(coinModule.getBalance).toHaveBeenLastCalledWith(context, ADDRESS);
  });

  it("lists under the operation history bound when an account's read gives one", async () => {
    const walk = { bounded: true };
    const data = {
      descriptor: {
        currencyId: "ripple",
        derivationMode: "",
        index: 0,
        key: ADDRESS,
        derivationPath: "",
      },
      state: createMemoryStateStore(),
      history: createMemoryHistoryStore([]),
    };

    const module = accountModuleOf(ripple, deps(), {
      bound: { maxOperations: 10, pageSize: 5 },
      walk,
    });
    for await (const _ of module.sync(context, data)) {
      // drained
    }

    expect(coinModule.listOperations).toHaveBeenCalledWith(context, ADDRESS, {
      minHeight: 0,
      cursor: undefined,
      order: "desc",
      limit: 5,
    });
    // The listing reached its end.
    expect(walk.bounded).toBe(false);
  });
});

describe("localNetworkOf", () => {
  it("serves the currency on Ledger Wallet's modules, with no derivation nor registration by default", () => {
    const network = localNetworkOf(ripple, deps(), { getTokenFromAsset: undefined });
    expect(network).toEqual({
      currencyId: "ripple",
      context,
      coinModule,
      accountModule: expect.anything(),
      derivationMode: "",
      derivationPath: "",
      nativeAsset: { name: "XRP", ticker: "XRP", decimals: 6 },
      registrationTypes: [],
    });
  });

  it("resolves an asset through the family's catalog, and hands the balance options over", async () => {
    const balanceOptions = { includeAssets: async () => true };
    const getTokenFromAsset = jest.fn(async (asset: AssetInfo) =>
      (asset as { assetReference?: string }).assetReference === "USD.rIssuer"
        ? (token as never)
        : undefined,
    );
    const network = localNetworkOf(ripple, deps({ bridgeApi: { balanceOptions } }), {
      derivationMode: "mode",
      derivationPath: "44'/144'/0'/0/0",
      registrationTypes: ["static"],
      getTokenFromAsset,
    });

    expect(network).toMatchObject({
      derivationMode: "mode",
      derivationPath: "44'/144'/0'/0/0",
      registrationTypes: ["static"],
      balanceOptions,
    });
    await expect(network.resolveAsset?.(usd)).resolves.toEqual({
      cal_id: "ripple/token/usd",
      name: "US Dollar",
      ticker: "USD",
      decimals: 2,
    });
    await expect(network.resolveAsset?.({ type: "token" })).resolves.toBeUndefined();
  });
});

describe("portfolioSides", () => {
  it.each(["https://portfolio.test", ""])(
    "wires no service for a chain in local mode (service url %j)",
    async url => {
      configure("local", url);
      const network = localNetworkOf(ripple, deps(), { getTokenFromAsset: undefined });
      const { local, remote, portfolio, store } = portfolioSides(
        "xrp",
        network,
        "local",
        () => "id",
      );

      expect(remote).toBe(localModeRemote);
      await local.createPortfolio("p");
      await expect(store.get("p")).resolves.toMatchObject({ id: "p" });
      await expect(portfolio.getLastBlock("xrp")).resolves.toMatchObject({ height: 120 });
      // A call the router sends to both sides answers the local side alone.
      await expect(portfolio.getPortfolio("p")).resolves.toMatchObject({ id: "p" });
      expect(createPortfolioServiceClient).not.toHaveBeenCalled();
    },
  );

  it("fails the service side of a hybrid chain without a service url", async () => {
    configure("hybrid", "");
    const network = localNetworkOf(ripple, deps(), { getTokenFromAsset: undefined });
    const { remote } = portfolioSides("xrp", network, "hybrid", () => "id");

    expect(remote).toBe(unavailablePortfolio);
    expect(createPortfolioServiceClient).not.toHaveBeenCalled();
  });

  it("routes to the service its url names", async () => {
    configure("remote");
    const service = { getLastBlock: jest.fn(async () => ({ height: 150 })) };
    (createPortfolioServiceClient as jest.Mock).mockReturnValue(service);
    const network = localNetworkOf(ripple, deps(), { getTokenFromAsset: undefined });
    const { remote, portfolio } = portfolioSides("xrp", network, "remote", () => "id");

    expect(createPortfolioServiceClient).toHaveBeenCalledWith({
      baseUrl: "https://portfolio.test",
    });
    expect(remote).toBe(service);
    await expect(portfolio.getLastBlock("xrp")).resolves.toEqual({ height: 150 });
    expect(coinModule.lastBlock).not.toHaveBeenCalled();
  });
});

describe("openNetworkPortfolio", () => {
  it("routes the network's calls by its mode, with no registration", async () => {
    configure("local", "");
    const getTokenFromAsset = jest.fn(async () => undefined);
    const opened = await openNetworkPortfolio(
      ripple,
      deps({ bridgeApi: { getTokenFromAsset } }),
      "read",
    );

    expect(opened).toMatchObject({ network: "xrp", mode: "local" });
    await expect(opened.portfolio.getLastBlock("xrp")).resolves.toMatchObject({ height: 120 });
    await expect(opened.portfolio.getAccountInfo?.("xrp", ADDRESS)).resolves.toEqual({
      type: "none",
    });
    await expect(opened.portfolio.listNetworks()).resolves.toEqual(["xrp"]);
  });

  it("writes through the service in remote mode", async () => {
    configure("remote");
    const service = { broadcastTransaction: jest.fn(async () => ({ transactionId: "hash" })) };
    (createPortfolioServiceClient as jest.Mock).mockReturnValue(service);
    const opened = await openNetworkPortfolio(ripple, deps(), "write");

    await expect(
      opened.portfolio.broadcastTransaction("xrp", { signedTransaction: "signed" }),
    ).resolves.toEqual({ transactionId: "hash" });
    expect(coinModule.broadcast).not.toHaveBeenCalled();
  });
});
