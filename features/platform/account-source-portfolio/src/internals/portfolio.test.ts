import { DUMMY_PORTFOLIO_ID, PortfolioId } from "@domain/entity-client-identity";
import { ETH, POLYGON, PORTFOLIO_ID, depsOf, evm, fakeService, synced } from "./fakeService.mock";
import { listPortfolio, reconcile, refresh } from "./portfolio";

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
    client.getPortfolio.mockRejectedValue(new Error(`500 for ${ETH.address}`));
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

describe("reconcile", () => {
  it("registers what is missing and removes what no account needs", async () => {
    const service = fakeService({ portfolio: synced([evm(9)]) });

    await reconcile(depsOf(service.client), [ETH, POLYGON]);

    expect(service.client.removeRegistrations).toHaveBeenCalledWith(expect.anything(), ["known-0"]);
    expect(service.state.portfolio?.registrations).toEqual([
      expect.objectContaining({ type: "evm", address: ETH.address }),
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
