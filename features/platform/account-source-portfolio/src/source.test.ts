import { configureStore } from "@reduxjs/toolkit";
import type {
  BalanceEntry,
  BalanceGroup,
  Portfolio,
  PortfolioAccount,
  PortfolioRegistration,
} from "@domain/api-account-portfolio";
import type { AccountTarget } from "@domain/api-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { PortfolioId } from "@domain/entity-client-identity";
import type { PortfolioClient } from "./client";
import { address, EVM_ADDRESS, EVM_PATH } from "./registration/fixtures";
import { createPortfolioSourceRuntime } from "./runtime";
import { portfolioSourceSlice } from "./slice";
import { createPortfolioSource } from "./source";

const evmId = (network: string) => `${network}:${EVM_ADDRESS.toLowerCase()}`;

const entry = (overrides: Partial<BalanceEntry>): BalanceEntry => ({
  network: "ethereum",
  account_id: evmId("ethereum"),
  asset: "native",
  name: "Ether",
  ticker: "ETH",
  decimals: 18,
  amount: "100",
  estimated: false,
  status: "confirmed",
  locked: false,
  ...overrides,
});

const success = (network: string, items: BalanceEntry[]): BalanceGroup => ({
  type: "success",
  network,
  account_id: evmId(network),
  items,
});

/** The service as the source sees it: an `evm` registration fans out to the networks listed. */
function fakeService({
  networks = ["ethereum", "polygon"],
  status = "synchronized",
}: { networks?: string[]; status?: PortfolioAccount["status"] } = {}) {
  let portfolio: Portfolio | undefined;
  const balances = new Map<string, BalanceGroup>();
  const calls: string[] = [];
  const client: PortfolioClient = {
    getPortfolio: async () => {
      calls.push("getPortfolio");
      return portfolio;
    },
    createPortfolio: async () => {
      calls.push("createPortfolio");
      portfolio = { id: "p", registrations: [], accounts: [] };
      return portfolio;
    },
    addRegistrations: async (_id, registrations: PortfolioRegistration[]) => {
      calls.push(`addRegistrations:${registrations.length}`);
      const added = registrations.flatMap(r => ("address" in r ? [r.address.toLowerCase()] : []));
      portfolio = {
        id: "p",
        registrations: [
          ...(portfolio?.registrations ?? []),
          ...added.map(addr => ({ id: `reg-${addr}`, type: "evm", address: addr })),
        ],
        accounts: [
          ...(portfolio?.accounts ?? []),
          ...added.flatMap(addr =>
            networks.map(network => ({ id: `${network}:${addr}`, network, status })),
          ),
        ],
      };
      return portfolio;
    },
    removeRegistrations: async (_id, ids) => {
      calls.push(`removeRegistrations:${ids.length}`);
      portfolio = {
        id: "p",
        accounts: portfolio?.accounts,
        registrations: portfolio?.registrations?.filter(r => !ids.includes(r.id)),
      };
      return portfolio;
    },
    getBalance: async (_id, { account }) => {
      calls.push(account ? "getBalance:account" : "getBalance:page");
      return { items: [...balances.values()].filter(g => !account || g.account_id === account) };
    },
  };
  // The service fans the registered addresses out to a network it did not track yet.
  const fanOut = (network: string) => {
    const addresses = (portfolio?.registrations ?? []).flatMap(r => (r.address ? [r.address] : []));
    portfolio = {
      id: "p",
      registrations: portfolio?.registrations,
      accounts: [
        ...(portfolio?.accounts ?? []),
        ...addresses.map(addr => ({ id: `${network}:${addr}`, network, status })),
      ],
    };
  };
  return { client, calls, balances, fanOut };
}

function setup(service = fakeService(), { scanMaxAge }: { scanMaxAge?: number } = {}) {
  const store = configureStore({
    reducer: { accountSourcePortfolio: portfolioSourceSlice.reducer },
  });
  const runtime = createPortfolioSourceRuntime({ clientOf: () => service.client, scanMaxAge });
  const ports = {
    dispatch: store.dispatch,
    getState: store.getState,
    portfolioId: () => PortfolioId.fromString("install-portfolio"),
  };
  const source = createPortfolioSource({ runtime, ports });
  const read = (descriptors: AccountDescriptor[]) => {
    const targets: AccountTarget[] = descriptors.map(descriptor => ({
      descriptor,
      accountUUID: computeAccountUUID(descriptor),
    }));
    const balance = source.readBatch?.balance;
    if (!balance) throw new Error("no batch balance reader");
    return balance(targets, undefined);
  };
  const outcomeOf = (descriptor: AccountDescriptor) =>
    store.getState().accountSourcePortfolio.outcomes[computeAccountUUID(descriptor)];
  return { store, runtime, ports, source, read, service, outcomeOf };
}

const ethereum = address("ethereum", EVM_ADDRESS, EVM_PATH);
const polygon = address("polygon", EVM_ADDRESS, EVM_PATH);
const notServed = { status: "rejected", reason: { name: "AccountDataNotServedError" } };

describe("createPortfolioSource", () => {
  it("supports the balance of an account a strategy registers", () => {
    const { source } = setup();
    expect(source.supports(ethereum, "balance")).toBe(true);
    expect(source.supports(address("solana", "9xyz", "m/44h/501h/0h/0h"), "balance")).toBe(false);
  });

  it("creates the portfolio and registers an address shared by two networks once", async () => {
    const { read, service } = setup();
    await read([ethereum, polygon]);
    expect(service.calls.slice(0, 3)).toEqual([
      "getPortfolio",
      "createPortfolio",
      "addRegistrations:1",
    ]);
  });

  it("answers each account from its own group, the locked part not spendable", async () => {
    const service = fakeService();
    service.balances.set(
      evmId("ethereum"),
      success("ethereum", [
        entry({ amount: "100" }),
        entry({ amount: "30", locked: true }),
        entry({ amount: "999", status: "pending" }),
        entry({ asset: "erc20.0xabc", cal_id: "ethereum/erc20/usdt", amount: "5" }),
        entry({ asset: "erc20.0xdef", amount: "7" }),
      ]),
    );
    const { read, outcomeOf } = setup(service);
    const [eth] = await read([ethereum]);
    expect(eth).toEqual({
      status: "fulfilled",
      value: [
        { assetId: "ethereum", balance: "130", spendableBalance: "100" },
        { assetId: "ethereum/erc20/usdt", balance: "5", spendableBalance: "5" },
      ],
    });
    expect(outcomeOf(ethereum)).toMatchObject({ outcome: "ok", rows: 2 });
  });

  it("puts the native coin first, whatever order the service lists the assets in", async () => {
    const service = fakeService();
    service.balances.set(
      evmId("ethereum"),
      success("ethereum", [
        entry({ asset: "erc20.0xabc", cal_id: "ethereum/erc20/usdt", amount: "5" }),
        entry({ amount: "100" }),
      ]),
    );
    const { read } = setup(service);
    const [eth] = await read([ethereum]);
    expect(eth).toMatchObject({
      status: "fulfilled",
      value: [{ assetId: "ethereum" }, { assetId: "ethereum/erc20/usdt" }],
    });
  });

  it("hands an account with no native coin balance to the next source", async () => {
    const service = fakeService();
    service.balances.set(evmId("ethereum"), success("ethereum", []));
    const { read, outcomeOf } = setup(service);
    expect((await read([ethereum]))[0]).toMatchObject(notServed);
    expect(outcomeOf(ethereum)).toMatchObject({
      outcome: "pending",
      detail: "No native coin balance yet",
    });
  });

  it("hands an account with an unreadable amount to the next source", async () => {
    const service = fakeService();
    service.balances.set(
      evmId("ethereum"),
      success("ethereum", [
        entry({ amount: "1.5" }),
        entry({ asset: "erc20.0xabc", cal_id: "ethereum/erc20/usdt", amount: "5" }),
      ]),
    );
    const { read, outcomeOf } = setup(service);
    expect((await read([ethereum]))[0]).toMatchObject(notServed);
    expect(outcomeOf(ethereum)).toMatchObject({
      outcome: "failed",
      detail: "1 assets with an unreadable amount",
    });
  });

  it("hands a failed group to the next source, the service message kept in the outcome", async () => {
    const service = fakeService();
    service.balances.set(evmId("polygon"), {
      type: "failure",
      network: "polygon",
      account_id: evmId("polygon"),
      error: "Unable to fetch account balance",
    });
    const { read, outcomeOf } = setup(service);
    const [, pol] = await read([ethereum, polygon]);
    expect(pol).toMatchObject(notServed);
    expect(outcomeOf(polygon)).toMatchObject({
      outcome: "failed",
      detail: "Unable to fetch account balance",
    });
  });

  it("hands an account the service is still syncing to the next source", async () => {
    const { read, outcomeOf } = setup(fakeService({ status: "uninitialized" }));
    const [eth] = await read([ethereum]);
    expect(eth).toMatchObject(notServed);
    expect(outcomeOf(ethereum)).toMatchObject({
      outcome: "pending",
      detail: "Service account uninitialized",
    });
  });

  it("hands an account to the next source while the registration has not fanned out", async () => {
    const { read, outcomeOf } = setup(fakeService({ networks: [] }));
    expect((await read([ethereum]))[0]).toMatchObject(notServed);
    expect(outcomeOf(ethereum)).toMatchObject({ outcome: "pending", detail: "Not created yet" });
  });

  it("stops claiming a network the service listed no account on", async () => {
    const { read, source, outcomeOf } = setup(fakeService({ networks: ["ethereum"] }));
    expect(source.supports(polygon, "balance")).toBe(true);
    const [, pol] = await read([ethereum, polygon]);
    expect(pol).toMatchObject(notServed);
    expect(outcomeOf(polygon)).toMatchObject({ outcome: "failed" });
    expect(source.supports(polygon, "balance")).toBe(false);
  });

  it("probes a network again once the listing that left it out is stale", async () => {
    const service = fakeService({ networks: ["ethereum"] });
    const { read, source } = setup(service);
    await read([ethereum, polygon]);
    expect(source.supports(polygon, "balance")).toBe(false);

    service.fanOut("polygon");
    service.balances.set(evmId("polygon"), success("polygon", [entry({ network: "polygon" })]));
    const later = Date.now() + 61_000;
    jest.spyOn(Date, "now").mockReturnValue(later);
    expect(source.supports(polygon, "balance")).toBe(true);
    expect((await read([polygon]))[0]).toMatchObject({ status: "fulfilled" });
    expect(source.supports(polygon, "balance")).toBe(true);
    jest.mocked(Date.now).mockRestore();
  });

  it("hands every account to the next source when a service call fails", async () => {
    const service = fakeService();
    const { read, outcomeOf } = setup(service);
    await read([ethereum]);
    service.client.getBalance = () =>
      Promise.reject(new Error("Portfolio service call failed: 503"));
    expect(await read([ethereum])).toMatchObject([notServed]);
    expect(outcomeOf(ethereum)).toMatchObject({
      outcome: "failed",
      detail: "Error: Portfolio service call failed: 503",
    });
  });

  it("registers once when two batches are read at once", async () => {
    const { read, service } = setup();
    await Promise.all([read([ethereum]), read([polygon])]);
    expect(service.calls.filter(call => call.startsWith("addRegistrations"))).toEqual([
      "addRegistrations:1",
    ]);
  });

  it("does not list the portfolio again once every account has its service ids", async () => {
    const { read, service } = setup();
    await read([ethereum]);
    service.calls.length = 0;
    await read([ethereum]);
    expect(service.calls).toEqual(["getBalance:account"]);
  });

  it("reuses a scan still in flight, however long it takes", async () => {
    const networks = ["ethereum", "polygon", "arbitrum", "base", "optimism"];
    const service = fakeService({ networks });
    const { read } = setup(service, { scanMaxAge: 0 });
    const answer = service.client.getBalance;
    service.client.getBalance = async (id, params) => {
      await new Promise(resolve => setTimeout(resolve, 20));
      return answer(id, params);
    };
    const accounts = networks.map(network => address(network, EVM_ADDRESS, EVM_PATH));
    await read(accounts.slice(0, 1));
    service.calls.length = 0;
    await Promise.all([read(accounts.slice(0, 4)), read(accounts.slice(1, 5))]);
    expect(service.calls.filter(call => call === "getBalance:page")).toEqual(["getBalance:page"]);
  });

  it("shares one balance scan between the batches of a refresh", async () => {
    const networks = ["ethereum", "polygon", "arbitrum", "base", "optimism"];
    const { read, service } = setup(fakeService({ networks }));
    const accounts = networks.map(network => address(network, EVM_ADDRESS, EVM_PATH));
    await Promise.all([read(accounts.slice(0, 4)), read(accounts.slice(1, 5))]);
    expect(service.calls.filter(call => call.startsWith("getBalance"))).toEqual([
      "getBalance:page",
    ]);
  });
});

describe("PortfolioSourceRuntime.reconcile", () => {
  it("removes the registrations no account needs", async () => {
    const { runtime, ports, service, store } = setup();
    await runtime.ensure(ports, [ethereum]);
    await runtime.reconcile(ports, []);
    expect(service.calls).toContain("removeRegistrations:1");
    expect(store.getState().accountSourcePortfolio.server?.portfolio.registrations).toEqual([]);
  });

  it("keeps the registrations the accounts still need", async () => {
    const { runtime, ports, service } = setup();
    await runtime.ensure(ports, [ethereum]);
    await runtime.reconcile(ports, [ethereum, polygon]);
    expect(service.calls.some(call => call.startsWith("removeRegistrations"))).toBe(false);
  });
});
