import {
  mockAccountBalance,
  mockTokenAccountBalance,
} from "@domain/entity-account-balance/schema.mock";
import { describeAccountDataSourceContract } from "../sourceRequirements";
import { accountIdFor, makeRef } from "../port.mock";
import type { AccountSlice, SliceUpdate } from "../port";
import { createLegacyBridgeSource, type LegacyBridgePort } from "./legacyBridgeSource";

const ref = makeRef({ currencyId: "bitcoin", accountId: accountIdFor("bc1q") });

const balances = [
  mockAccountBalance({ accountId: ref.accountId }),
  mockTokenAccountBalance({ parentId: ref.accountId }),
];

const port = (overrides: Partial<LegacyBridgePort> = {}): LegacyBridgePort => ({
  supports: () => true,
  sync: async () => ({ balances }),
  ...overrides,
});

const collect = async (
  source: ReturnType<typeof createLegacyBridgeSource>,
  slices: AccountSlice[],
) => {
  const updates: SliceUpdate[] = [];
  for await (const update of source.fetch({ ref, slices, reason: "test" })) updates.push(update);
  return updates;
};

describe("createLegacyBridgeSource", () => {
  it("ranks below every granular source", () => {
    expect(createLegacyBridgeSource(port()).priority).toBe(0);
  });

  it("declares no capability, so the router never selects it for a slice", () => {
    expect([...createLegacyBridgeSource(port()).capabilities(ref)]).toEqual([]);
  });

  it("declares what one sync actually emits, so the router can subtract it", () => {
    expect([...createLegacyBridgeSource(port()).deliveries(ref)]).toEqual(["balance"]);
  });

  it("refuses a token-account ref, so a token id never keys an account-wide replacement", () => {
    const source = createLegacyBridgeSource(port());
    const tokenRef = makeRef({
      accountId: accountIdFor("bc1q-token"),
      parentId: ref.accountId,
    });
    expect(source.supports(tokenRef)).toBe(false);
    expect([...source.deliveries(tokenRef)]).toEqual([]);
  });

  it("defers support to the port", () => {
    expect(createLegacyBridgeSource(port({ supports: () => false })).supports(ref)).toBe(false);
  });

  it("emits the balances the sync produced", async () => {
    const [update] = await collect(createLegacyBridgeSource(port()), ["balance"]);
    expect(update).toEqual({ slice: "balance", accountId: ref.accountId, balances });
  });

  it("over-delivers balance even when it was only asked for something else", async () => {
    // Not a quirk: a full sync produces everything whatever was requested, and saying so is what
    // lets the router avoid a second call for data that is already on its way.
    const updates = await collect(createLegacyBridgeSource(port()), ["resources"]);
    expect(updates.map(update => update.slice)).toEqual(["balance"]);
  });

  it("forwards the abort signal to the port", async () => {
    const sync = jest.fn(async () => ({ balances }));
    const controller = new AbortController();
    const source = createLegacyBridgeSource(port({ sync }));
    for await (const _ of source.fetch({
      ref,
      slices: ["balance"],
      reason: "test",
      signal: controller.signal,
    })) {
      // drain
    }
    expect(sync).toHaveBeenCalledWith(ref, controller.signal);
  });

  it("propagates a sync failure", async () => {
    const source = createLegacyBridgeSource(
      port({
        sync: async () => {
          throw new Error("bridge down");
        },
      }),
    );
    await expect(collect(source, ["balance"])).rejects.toThrow("bridge down");
  });
});

describeAccountDataSourceContract(
  "createLegacyBridgeSource contract",
  () => createLegacyBridgeSource(port()),
  { supported: ref },
);
