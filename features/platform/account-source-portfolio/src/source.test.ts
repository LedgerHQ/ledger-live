import { ETH, PORTFOLIO_ID, evm, fakeService, synced } from "./internals/fakeService.mock";
import { createPortfolioSource } from "./source";

function setup(service = fakeService()) {
  const handle = createPortfolioSource({
    dispatch: jest.fn(),
    portfolioId: PORTFOLIO_ID,
    client: service.client,
  });
  return { ...service, handle };
}

describe("createPortfolioSource", () => {
  it("serves no read yet and calls nothing until asked", () => {
    const { handle, client } = setup();
    expect(handle.source.readBatch).toBeUndefined();
    expect(Object.values(client).every(call => call.mock.calls.length === 0)).toBe(true);
  });

  it("reconciles the portfolio with the accounts", async () => {
    const { handle, state } = setup(fakeService({ portfolio: synced([evm(9)]) }));

    await handle.reconcile([ETH]);

    expect(state.portfolio?.registrations).toEqual([
      expect.objectContaining({ type: "evm", address: ETH.address }),
    ]);
  });

  it("keeps a stable snapshot between changes and notifies its listeners", async () => {
    const { handle } = setup(fakeService({ portfolio: synced([ETH]) }));
    const listener = jest.fn();
    handle.subscribe(listener);
    const before = handle.getSnapshot();
    expect(handle.getSnapshot()).toBe(before);

    await handle.refresh();

    expect(listener).toHaveBeenCalled();
    expect(handle.getSnapshot()).not.toBe(before);
    expect(handle.getSnapshot()).toMatchObject({
      busy: false,
      listing: { portfolio: { id: "p" } },
    });
  });
});
