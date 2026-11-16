import { DUMMY_PORTFOLIO_ID, PortfolioId } from "@domain/entity-client-identity";
import { ETH, POLYGON, PORTFOLIO_ID, depsOf, evm, fakeService, synced } from "./fakeService.mock";
import {
  PortfolioReadCancelledError,
  listPortfolio,
  reconcile,
  refresh,
  registerMissing,
  whenReady,
} from "./portfolio";

describe("listPortfolio", () => {
  it("creates the portfolio when the service does not know it", async () => {
    const { client } = fakeService();
    const deps = depsOf(client);

    const portfolio = await listPortfolio(deps, PORTFOLIO_ID());

    expect(client.createPortfolio).toHaveBeenCalledTimes(1);
    expect(deps.store.get().listing?.portfolio).toBe(portfolio);
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: true,
      summary: "Created the portfolio",
    });
  });

  it("lists a known portfolio without creating it", async () => {
    const { client } = fakeService({ portfolio: synced([ETH]) });
    const deps = depsOf(client);

    await listPortfolio(deps, PORTFOLIO_ID());

    expect(client.createPortfolio).not.toHaveBeenCalled();
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      summary: "Listed: 1 registrations, 1 service accounts",
    });
  });
});

describe("refresh", () => {
  it("logs a failed listing and rethrows it", async () => {
    const { client } = fakeService();
    client.getPortfolio.mockRejectedValue(new Error(`500 for ${ETH.key}`));
    const deps = depsOf(client);

    await expect(refresh(deps)).rejects.toThrow("500 for");

    expect(deps.store.get()).toMatchObject({ busy: false });
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: false,
      summary: "Refresh failed: Unexpected error",
    });
  });
});

describe("the portfolio id", () => {
  it("refuses the placeholder every install holds before identities load, calling nothing", async () => {
    const { client } = fakeService({ portfolio: synced([evm(9)]) });
    const deps = { ...depsOf(client), portfolioId: () => DUMMY_PORTFOLIO_ID };

    await expect(refresh(deps)).rejects.toThrow("not loaded yet");
    await expect(reconcile(deps, [ETH])).rejects.toThrow("not loaded yet");

    expect(Object.values(client).every(call => call.mock.calls.length === 0)).toBe(true);
    expect(deps.store.get().activity.at(-1)).toMatchObject({
      ok: false,
      summary: "Reconcile failed: The install's portfolio id is not loaded yet",
    });
  });

  it("stays the one read when an operation starts, even if it changes mid-way", async () => {
    const { client } = fakeService({ portfolio: synced([evm(9)]) });
    const ids = [PORTFOLIO_ID(), PortfolioId.fromString("other")];
    const deps = { ...depsOf(client), portfolioId: () => ids.shift() ?? PORTFOLIO_ID() };

    await reconcile(deps, [ETH]);

    const used = [client.getPortfolio, client.addRegistrations, client.removeRegistrations].map(
      call => call.mock.calls[0]?.[0].equals(PORTFOLIO_ID()),
    );
    expect(used).toEqual([true, true, true]);
  });
});

describe("registerMissing", () => {
  it("registers an address shared by two networks once", async () => {
    const { client } = fakeService();

    await registerMissing(depsOf(client), [ETH, POLYGON]);

    expect(client.addRegistrations.mock.calls.map(([, registrations]) => registrations)).toEqual([
      [{ type: "evm", address: ETH.key }],
    ]);
  });

  it("registers once when two batches run at once", async () => {
    const { client } = fakeService();
    const deps = depsOf(client);

    await Promise.all([registerMissing(deps, [ETH]), registerMissing(deps, [evm(2), ETH])]);

    expect(client.addRegistrations.mock.calls.map(([, registrations]) => registrations)).toEqual([
      [{ type: "evm", address: ETH.key }],
      [{ type: "evm", address: evm(2).key }],
    ]);
  });
});

describe("whenReady", () => {
  it("stops waiting, with its listing in flight, once its signal aborts", async () => {
    const { client } = fakeService({ portfolio: synced([]) });
    const deps = depsOf(client);
    const cancel = new AbortController();
    const listings: (AbortSignal | undefined)[] = [];
    client.getPortfolio.mockResolvedValueOnce(synced([])).mockImplementation((_id, signal) => {
      listings.push(signal);
      const listing = new Promise<never>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
      cancel.abort();
      return listing;
    });

    await expect(whenReady(deps, [ETH], cancel.signal)).rejects.toBeInstanceOf(
      PortfolioReadCancelledError,
    );

    expect(client.getPortfolio).toHaveBeenCalledTimes(2);
    expect(listings.map(signal => signal?.aborted)).toEqual([true]);
    expect(deps.now()).toBe(3_000);
    expect(deps.store.get().busy).toBe(false);
  });

  it("stops when cancelled during its first listing, registering nothing", async () => {
    const { client } = fakeService({ portfolio: synced([]) });
    const cancel = new AbortController();
    client.getPortfolio.mockImplementation((_id, signal) => {
      const listing = new Promise<never>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
      cancel.abort();
      return listing;
    });

    await expect(whenReady(depsOf(client), [ETH], cancel.signal)).rejects.toBeInstanceOf(
      PortfolioReadCancelledError,
    );

    expect(client.addRegistrations).not.toHaveBeenCalled();
  });

  it("stops when cancelled during a registration that leaves every account ready", async () => {
    const { client, state } = fakeService({ portfolio: synced([]) });
    const cancel = new AbortController();
    client.addRegistrations.mockImplementationOnce(async () => {
      cancel.abort();
      state.portfolio = synced([ETH]);
      return state.portfolio;
    });

    await expect(whenReady(depsOf(client), [ETH], cancel.signal)).rejects.toBeInstanceOf(
      PortfolioReadCancelledError,
    );

    expect(client.addRegistrations).toHaveBeenCalledTimes(1);
  });

  it("does not start once its signal has aborted", async () => {
    const { client } = fakeService({ portfolio: synced([]) });

    await expect(whenReady(depsOf(client), [ETH], AbortSignal.abort())).rejects.toBeInstanceOf(
      PortfolioReadCancelledError,
    );

    expect(client.getPortfolio).not.toHaveBeenCalled();
  });

  it("stays busy while it waits, and aborts a listing past its deadline", async () => {
    const { client } = fakeService({ portfolio: synced([]) });
    const base = depsOf(client);
    const deps = { ...base, timeout: base.sleep };
    const busyWhileListing: boolean[] = [];
    const signals: (AbortSignal | undefined)[] = [];
    client.getPortfolio.mockResolvedValueOnce(synced([])).mockImplementation((_id, signal) => {
      busyWhileListing.push(deps.store.get().busy);
      signals.push(signal);
      return new Promise(() => {});
    });

    const { portfolio } = await whenReady(deps, [ETH]);

    expect(portfolio.accounts).toEqual([]);
    expect(client.getPortfolio).toHaveBeenCalledTimes(2);
    expect(busyWhileListing).toEqual([true]);
    expect(signals.map(signal => signal?.aborted)).toEqual([true]);
    expect(deps.now()).toBe(120_000);
    expect(deps.store.get().busy).toBe(false);
  });

  it("returns as soon as every account is synchronized", async () => {
    const { client } = fakeService({ portfolio: synced([]) });
    client.getPortfolio.mockResolvedValueOnce(synced([])).mockResolvedValue(synced([ETH]));
    const timers: AbortSignal[] = [];
    const deps = {
      ...depsOf(client),
      timeout: (_ms: number, signal: AbortSignal) => {
        timers.push(signal);
        return new Promise<void>(() => {});
      },
    };

    await whenReady(deps, [ETH]);

    expect(client.getPortfolio).toHaveBeenCalledTimes(2);
    expect(deps.now()).toBe(3_000);
    expect(timers.map(signal => signal.aborted)).toEqual([true]);
  });
});

describe("reconcile", () => {
  it("registers what is missing and removes what no account needs", async () => {
    const service = fakeService({ portfolio: synced([evm(9)]) });

    await reconcile(depsOf(service.client), [ETH, POLYGON]);

    expect(service.client.removeRegistrations).toHaveBeenCalledWith(expect.anything(), ["known-0"]);
    expect(service.state.portfolio?.registrations).toEqual([
      expect.objectContaining({ type: "evm", address: ETH.key }),
    ]);
  });

  it("leaves the registrations of other families alone", async () => {
    const portfolio = synced([ETH]);
    const service = fakeService({
      portfolio: {
        ...portfolio,
        registrations: [
          ...(portfolio.registrations ?? []),
          { id: "dot", type: "account", network: "polkadot", addresses: ["1abc"] },
          { id: "sol", type: "solana", address: "9x" },
        ],
      },
    });

    await reconcile(depsOf(service.client), [ETH]);

    expect(service.client.removeRegistrations).not.toHaveBeenCalled();
  });

  it.each([
    ["no account", []],
    ["mock accounts only", [{ ...evm(2), purpose: "mock" as const }]],
  ])("refuses to run with %s", async (_, descriptors) => {
    const { client } = fakeService({ portfolio: synced([ETH]) });
    const deps = depsOf(client);

    await reconcile(deps, descriptors);

    expect(client.getPortfolio).not.toHaveBeenCalled();
    expect(client.removeRegistrations).not.toHaveBeenCalled();
    expect(deps.store.get().activity.at(-1)).toMatchObject({ ok: false });
  });

  it("never registers mock accounts", async () => {
    const { client } = fakeService({ portfolio: synced([ETH]) });

    await reconcile(depsOf(client), [ETH, { ...evm(2), purpose: "mock" }]);

    expect(client.addRegistrations).not.toHaveBeenCalled();
    expect(client.removeRegistrations).not.toHaveBeenCalled();
  });
});
