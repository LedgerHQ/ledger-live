import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  ADA,
  BITCOIN,
  DOT,
  ETH,
  PORTFOLIO_ID,
  TRX,
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

describe("the families the source serves", () => {
  it("supports the families the service synchronizes, from the descriptor alone", () => {
    const { supports } = setup().handle.source;

    for (const descriptor of [ETH, BITCOIN, ADA, TRX]) {
      expect(supports(descriptor, "balance")).toBe(true);
    }
    expect(supports(mockUtxoAccountDescriptor({ path: "m/49h/0h/0h" }), "balance")).toBe(false);
    expect(supports(DOT, "balance")).toBe(false);
  });

  it("registers each family with its own shape, then reads its balance", async () => {
    const descriptors = [BITCOIN, ADA, TRX];
    const { handle, client, state } = setup(
      fakeService({ groups: descriptors.map(each => group(each)) }),
    );
    client.addRegistrations.mockImplementationOnce(async () => {
      state.portfolio = synced(descriptors);
      return state.portfolio;
    });

    const balances = await handle.source.readBatch?.balance?.(
      descriptors.map(descriptor => ({ accountUUID: computeAccountUUID(descriptor), descriptor })),
      undefined,
    );

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
});
