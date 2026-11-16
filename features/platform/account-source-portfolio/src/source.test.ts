import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  BTC,
  DOT,
  ETH,
  PORTFOLIO_ID,
  evm,
  fakeService,
  group,
  historyGroup,
  synced,
  update,
} from "./internals/fakeService.mock";
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
  it("supports the balance and operations of EVM accounts, from the descriptor alone", () => {
    const { handle, client } = setup();
    const { supports } = handle.source;

    expect(supports(ETH, "balance")).toBe(true);
    expect(supports(ETH, "operations")).toBe(true);
    expect(supports(ETH, "balanceHistory")).toBe(true);
    expect(supports(evm(2, "ethereum_classic"), "balance")).toBe(true);
    expect(supports(evm(2, "hypercore"), "balance")).toBe(false);
    expect(supports(BTC, "balance")).toBe(false);
    expect(supports(DOT, "balance")).toBe(false);
    expect(Object.values(client).every(call => call.mock.calls.length === 0)).toBe(true);
  });

  it("serves a balance read through its batch reader", async () => {
    const { handle } = setup(fakeService({ portfolio: synced([ETH]), groups: [group(ETH)] }));

    const settled = await handle.source.readBatch?.balance?.(
      [{ accountUUID: computeAccountUUID(ETH), descriptor: ETH }],
      undefined,
    );

    expect(settled).toEqual([
      {
        status: "fulfilled",
        value: [{ assetId: "ethereum", balance: "10", spendableBalance: "10" }],
      },
    ]);
    expect(handle.getSnapshot().outcomes[computeAccountUUID(ETH)]).toMatchObject({
      status: "served",
    });
  });

  it("reconciles the portfolio with the accounts", async () => {
    const { handle, state } = setup(fakeService({ portfolio: synced([evm(9)]) }));

    await handle.reconcile([ETH]);

    expect(state.portfolio?.registrations).toEqual([
      expect.objectContaining({ type: "evm", address: ETH.key }),
    ]);
  });

  it("serves an operations read through its batch reader", async () => {
    const { handle } = setup(fakeService({ portfolio: synced([ETH]), updates: [update(ETH)] }));

    const settled = await handle.source.readBatch?.operations?.(
      [{ accountUUID: computeAccountUUID(ETH), descriptor: ETH }],
      { limit: 10 },
    );

    expect(settled).toEqual([
      {
        status: "fulfilled",
        value: { operations: [expect.objectContaining({ id: "ethereum-0xabc-IN" })] },
      },
    ]);
  });

  it("serves a balance history read through its batch reader", async () => {
    const { handle } = setup(
      fakeService({ portfolio: synced([ETH]), histories: [historyGroup(ETH)] }),
    );

    const settled = await handle.source.readBatch?.balanceHistory?.(
      [{ accountUUID: computeAccountUUID(ETH), descriptor: ETH }],
      { range: "week" },
    );

    expect(settled).toEqual([
      {
        status: "fulfilled",
        value: {
          range: "week",
          series: [
            { assetId: "ethereum", points: [{ date: "2026-10-01T00:00:00.000Z", balance: "10" }] },
          ],
        },
      },
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
