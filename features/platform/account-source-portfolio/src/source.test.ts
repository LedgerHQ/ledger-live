import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import {
  ADA,
  BTC,
  DOT,
  ETH,
  PORTFOLIO_ID,
  TRX,
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
  it("supports the families the service synchronizes, from the descriptor alone", () => {
    const { handle, client } = setup();
    const { supports } = handle.source;
    for (const descriptor of [ETH, evm(2, "ethereum_classic"), BTC, ADA, TRX]) {
      expect(supports(descriptor, "balance")).toBe(true);
      expect(supports(descriptor, "operations")).toBe(true);
      expect(supports(descriptor, "balanceHistory")).toBe(true);
    }
    expect(supports(evm(2, "hypercore"), "balance")).toBe(false);
    expect(supports(mockUtxoAccountDescriptor({ path: "m/49h/0h/0h" }), "balance")).toBe(false);
    expect(supports(DOT, "balance")).toBe(false);
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

  it("registers each family with its own shape, then reads every kind of each", async () => {
    const descriptors = [BTC, ADA, TRX];
    const service = fakeService({
      groups: descriptors.map(each => group(each)),
      histories: descriptors.map(each => historyGroup(each)),
      updates: descriptors.map(each => update(each)),
    });
    const { handle, client, state } = setup(service);
    client.addRegistrations.mockImplementationOnce(async () => {
      state.portfolio = synced(descriptors);
      return state.portfolio;
    });
    const targets = descriptors.map(descriptor => ({
      accountUUID: computeAccountUUID(descriptor),
      descriptor,
    }));

    const balances = await handle.source.readBatch?.balance?.(targets, undefined);
    const histories = await handle.source.readBatch?.balanceHistory?.(targets, { range: "week" });
    const operations = await handle.source.readBatch?.operations?.(targets, { limit: 10 });

    expect(client.addRegistrations.mock.calls[0]?.[1].map(each => each.type)).toEqual([
      "auto_derive",
      "auto_derive",
      "account",
    ]);
    expect(balances?.map(each => each.status === "fulfilled" && each.value[0])).toEqual(
      descriptors.map(({ network }) => ({
        assetId: network,
        balance: "10",
        spendableBalance: "10",
      })),
    );
    expect(histories?.every(each => each.status === "fulfilled")).toBe(true);
    expect(
      operations?.map(each => each.status === "fulfilled" && each.value.operations[0]?.id),
    ).toEqual(descriptors.map(({ network }) => `${network}-0xabc-IN`));
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
