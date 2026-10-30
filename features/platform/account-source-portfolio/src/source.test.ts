import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import {
  ETH,
  PORTFOLIO_ID,
  evm,
  fakeService,
  group,
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
  it("supports EVM balances and operations only, from the descriptor alone", () => {
    const { handle, client } = setup();
    const { supports } = handle.source;
    expect(supports(ETH, "balance")).toBe(true);
    expect(supports(ETH, "operations")).toBe(true);
    expect(supports(mockUtxoAccountDescriptor(), "operations")).toBe(false);
    expect(supports(evm(2, "ethereum_classic"), "balance")).toBe(true);
    expect(supports(mockUtxoAccountDescriptor(), "balance")).toBe(false);
    expect(
      supports(
        mockAddressAccountDescriptor({ network: "solana", address: "9x", path: "m/44h/501h/0h" }),
        "balance",
      ),
    ).toBe(false);
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
