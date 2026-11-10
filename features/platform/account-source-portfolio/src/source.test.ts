import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
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
  synced,
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

    expect(supports(ETH, "balance")).toBe(true);
    expect(supports(evm(2, "ethereum_classic"), "balance")).toBe(true);
    expect(supports(evm(2, "hypercore"), "balance")).toBe(false);
    expect(supports(BTC, "balance")).toBe(true);
    expect(supports(ADA, "balance")).toBe(true);
    expect(supports(TRX, "balance")).toBe(true);
    expect(supports(mockUtxoAccountDescriptor({ path: "m/49h/0h/0h" }), "balance")).toBe(false);
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
      expect.objectContaining({ type: "evm", address: ETH.address }),
    ]);
  });

  it("registers each family with its own shape, then reads its balance", async () => {
    const descriptors = [BTC, ADA, TRX];
    const { handle, client, state } = setup(
      fakeService({ groups: descriptors.map(each => group(each)) }),
    );
    client.addRegistrations.mockImplementationOnce(async () => {
      state.portfolio = synced(descriptors);
      return state.portfolio;
    });
    const targets = descriptors.map(descriptor => ({
      accountUUID: computeAccountUUID(descriptor),
      descriptor,
    }));

    const balances = await handle.source.readBatch?.balance?.(targets, undefined);

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
