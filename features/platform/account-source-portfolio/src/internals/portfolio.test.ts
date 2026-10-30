import { ETH, POLYGON, depsOf, evm, fakeService, synced } from "./fakeService.mock";
import { listPortfolio, reconcile, refresh, registerMissing } from "./portfolio";

describe("listPortfolio", () => {
  it("creates the portfolio when the service does not know it", async () => {
    const { client } = fakeService();
    const deps = depsOf(client);

    const portfolio = await listPortfolio(deps);

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

    await listPortfolio(deps);

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

describe("registerMissing", () => {
  it("registers an address shared by two networks once", async () => {
    const { client } = fakeService();

    await registerMissing(depsOf(client), [ETH, POLYGON]);

    expect(client.addRegistrations.mock.calls.map(([, registrations]) => registrations)).toEqual([
      [{ type: "evm", address: ETH.address }],
    ]);
  });

  it("registers once when two batches run at once", async () => {
    const { client } = fakeService();
    const deps = depsOf(client);

    await Promise.all([registerMissing(deps, [ETH]), registerMissing(deps, [evm(2), ETH])]);

    expect(client.addRegistrations.mock.calls.map(([, registrations]) => registrations)).toEqual([
      [{ type: "evm", address: ETH.address }],
      [{ type: "evm", address: evm(2).address }],
    ]);
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
          { id: "btc", type: "auto_derive", network: "bitcoin", xpub: "xpub-1" },
        ],
      },
    });

    await reconcile(depsOf(service.client), [ETH]);

    expect(service.client.removeRegistrations).not.toHaveBeenCalled();
  });

  it("refuses to run with no account", async () => {
    const { client } = fakeService({ portfolio: synced([ETH]) });
    const deps = depsOf(client);

    await reconcile(deps, []);

    expect(client.getPortfolio).not.toHaveBeenCalled();
    expect(client.removeRegistrations).not.toHaveBeenCalled();
    expect(deps.store.get().activity.at(-1)).toMatchObject({ ok: false });
  });
});
