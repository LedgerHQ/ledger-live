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

/** The service as the source sees it: an `evm` registration fans out to the networks listed. */
function fakeService({
  networks = ["ethereum", "polygon"],
  status = "synchronized",
}: { networks?: string[]; status?: PortfolioAccount["status"] } = {}) {
  const portfolios = new Map<string, Portfolio>();
  const balances = new Map<string, BalanceGroup>();
  const calls: string[] = [];
  const client: PortfolioClient = {
    getPortfolio: async id => {
      calls.push("getPortfolio");
      return portfolios.get(id);
    },
    createPortfolio: async id => {
      calls.push("createPortfolio");
      const created = { id, registrations: [], accounts: [] };
      portfolios.set(id, created);
      return created;
    },
    addRegistrations: async (id, registrations: PortfolioRegistration[]) => {
      calls.push(`addRegistrations:${registrations.length}`);
      const current = portfolios.get(id) ?? { id };
      const added = registrations.flatMap(r => ("address" in r ? [r.address.toLowerCase()] : []));
      const next: Portfolio = {
        id,
        registrations: [
          ...(current.registrations ?? []),
          ...added.map(addr => ({ id: `reg-${addr}`, type: "evm", address: addr })),
        ],
        accounts: [
          ...(current.accounts ?? []),
          ...added.flatMap(addr =>
            networks.map(network => ({ id: `${network}:${addr}`, network, status })),
          ),
        ],
      };
      portfolios.set(id, next);
      return next;
    },
    removeRegistrations: async (id, ids) => {
      calls.push(`removeRegistrations:${ids.length}`);
      const current = portfolios.get(id) ?? { id };
      const next = {
        ...current,
        registrations: current.registrations?.filter(r => !ids.includes(r.id)),
      };
      portfolios.set(id, next);
      return next;
    },
    getBalance: async ({ account }) => {
      calls.push(account ? "getBalance:account" : "getBalance:page");
      const items = [...balances.values()].filter(g => !account || g.account_id === account);
      return { items };
    },
  };
  return { client, calls, balances, portfolios };
}

function setup(service = fakeService()) {
  const store = configureStore({
    reducer: { accountSourcePortfolio: portfolioSourceSlice.reducer },
  });
  const runtime = createPortfolioSourceRuntime({
    newPortfolioId: () => "test-portfolio",
    clientOf: () => service.client,
  });
  const ports = { dispatch: store.dispatch, getState: store.getState };
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
  return { store, runtime, ports, source, read, service };
}

const ethereum = address("ethereum", EVM_ADDRESS, EVM_PATH);
const polygon = address("polygon", EVM_ADDRESS, EVM_PATH);

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
    service.balances.set(evmId("ethereum"), {
      type: "success",
      network: "ethereum",
      account_id: evmId("ethereum"),
      items: [
        entry({ amount: "100" }),
        entry({ amount: "30", locked: true }),
        entry({ amount: "999", status: "pending" }),
        entry({ asset: "erc20.0xabc", cal_id: "ethereum/erc20/usdt", amount: "5" }),
        entry({ asset: "erc20.0xdef", amount: "7" }),
      ],
    });
    service.balances.set(evmId("polygon"), {
      type: "failure",
      network: "polygon",
      account_id: evmId("polygon"),
      error: "Unable to fetch account balance",
    });
    const { read, store } = setup(service);
    const [eth, pol] = await read([ethereum, polygon]);
    expect(eth).toEqual({
      status: "fulfilled",
      value: [
        { assetId: "ethereum", balance: "130", spendableBalance: "100" },
        { assetId: "ethereum/erc20/usdt", balance: "5", spendableBalance: "5" },
      ],
    });
    expect(pol).toMatchObject({
      status: "rejected",
      reason: { message: "The service failed 1 balance read(s) of this account" },
    });
    const { outcomes } = store.getState().accountSourcePortfolio;
    expect(outcomes[computeAccountUUID(ethereum)]).toMatchObject({ outcome: "ok", rows: 2 });
    expect(outcomes[computeAccountUUID(polygon)]).toMatchObject({
      outcome: "failed",
      detail: "Unable to fetch account balance",
    });
  });

  it("says an account is pending while the service has no balance for it", async () => {
    const { read, store } = setup(fakeService({ status: "uninitialized" }));
    const [eth] = await read([ethereum]);
    expect(eth).toMatchObject({
      status: "rejected",
      reason: { name: "PortfolioAccountPendingError" },
    });
    expect(
      store.getState().accountSourcePortfolio.outcomes[computeAccountUUID(ethereum)],
    ).toMatchObject({ outcome: "pending" });
  });

  it("says the service does not serve a network its registration did not fan out to", async () => {
    const { read } = setup(fakeService({ networks: ["ethereum"] }));
    const [, pol] = await read([ethereum, polygon]);
    expect(pol).toMatchObject({
      status: "rejected",
      reason: { name: "PortfolioAccountNotServedError" },
    });
  });

  it("stops claiming a network the service listed no account on", async () => {
    const { read, source } = setup(fakeService({ networks: ["ethereum"] }));
    expect(source.supports(polygon, "balance")).toBe(true);
    await read([ethereum]);
    expect(source.supports(ethereum, "balance")).toBe(true);
    expect(source.supports(polygon, "balance")).toBe(false);
  });

  it("says an account is pending while the service has not fanned its registration out yet", async () => {
    const { read } = setup(fakeService({ networks: [] }));
    const [eth] = await read([ethereum]);
    expect(eth).toMatchObject({
      status: "rejected",
      reason: { name: "PortfolioAccountPendingError", message: "Not created by the service yet" },
    });
  });

  it("does not list the portfolio again once every account has its service ids", async () => {
    const { read, service } = setup();
    await read([ethereum]);
    service.calls.length = 0;
    await read([ethereum]);
    expect(service.calls).toEqual(["getBalance:account"]);
  });

  it("drops the outcomes of a read that started on a renewed portfolio", async () => {
    let next = 0;
    const service = fakeService();
    const store = configureStore({
      reducer: { accountSourcePortfolio: portfolioSourceSlice.reducer },
    });
    const runtime = createPortfolioSourceRuntime({
      newPortfolioId: () => `portfolio-${next++}`,
      clientOf: () => service.client,
    });
    const ports = { dispatch: store.dispatch, getState: store.getState };
    const balance = createPortfolioSource({ runtime, ports }).readBatch?.balance;
    const reading = balance?.(
      [{ descriptor: ethereum, accountUUID: computeAccountUUID(ethereum) }],
      undefined,
    );
    const renewing = runtime.renew(ports);
    await Promise.all([reading, renewing]);
    expect(store.getState().accountSourcePortfolio).toMatchObject({
      portfolioId: "portfolio-1",
      outcomes: {},
    });
  });

  it("marks the accounts failed when a service call fails the batch", async () => {
    const service = fakeService();
    const { read, store } = setup(service);
    await read([ethereum]);
    service.client.getBalance = () =>
      Promise.reject(new Error("Portfolio service call failed: 503"));
    await expect(read([ethereum])).rejects.toThrow("503");
    expect(
      store.getState().accountSourcePortfolio.outcomes[computeAccountUUID(ethereum)],
    ).toMatchObject({ outcome: "failed", detail: "Error: Portfolio service call failed: 503" });
  });

  it("registers once when two batches are read at once", async () => {
    const { read, service } = setup();
    await Promise.all([read([ethereum]), read([polygon])]);
    expect(service.calls.filter(call => call.startsWith("addRegistrations"))).toEqual([
      "addRegistrations:1",
    ]);
  });

  it("reads many accounts by paging through the portfolio", async () => {
    const networks = ["ethereum", "polygon", "arbitrum", "base"];
    const { read, service } = setup(fakeService({ networks }));
    await read(networks.map(network => address(network, EVM_ADDRESS, EVM_PATH)));
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

  it("starts over with a new portfolio id", async () => {
    let next = 0;
    const store = configureStore({
      reducer: { accountSourcePortfolio: portfolioSourceSlice.reducer },
    });
    const runtime = createPortfolioSourceRuntime({
      newPortfolioId: () => `portfolio-${next++}`,
      clientOf: () => fakeService().client,
    });
    const ports = { dispatch: store.dispatch, getState: store.getState };
    await runtime.refresh(ports);
    await runtime.renew(ports);
    const state = store.getState().accountSourcePortfolio;
    expect(state.portfolioId).toBe("portfolio-1");
    expect(state.server).toBeUndefined();
  });
});
