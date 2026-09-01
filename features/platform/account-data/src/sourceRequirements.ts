import { AccountBalanceSchema } from "@domain/entity-account-balance";
import { ACCOUNT_SLICES, type AccountDataSource, type AccountRef, type AccountSlice } from "./port";

export type AccountDataSourceContractOptions = {
  /** A ref the source is expected to support. */
  supported: AccountRef;
  /** A ref the source is expected to reject, when it rejects any. */
  unsupported?: AccountRef;
};

const collect = async (source: AccountDataSource, ref: AccountRef, slices: AccountSlice[]) => {
  const updates = [];
  for await (const update of source.fetch({ ref, slices, reason: "contract-test" })) {
    updates.push(update);
  }
  return updates;
};

/**
 * The invariants every `AccountDataSource` must hold, whatever it talks to.
 *
 * A source that breaks one of these breaks the router silently — the plan would look right and the
 * data would not arrive — so each implementation runs this suite rather than only its own tests.
 * Same idea as `describeCloudSyncModuleContract`: the contract is testable, so it is tested once.
 */
export function describeAccountDataSourceContract(
  name: string,
  makeSource: () => AccountDataSource,
  { supported, unsupported }: AccountDataSourceContractOptions,
): void {
  describe(name, () => {
    it("has a non-empty id and a numeric priority", () => {
      const source = makeSource();
      expect(source.id).toBeTruthy();
      expect(Number.isFinite(source.priority)).toBe(true);
    });

    it("declares capabilities drawn only from the slice vocabulary", () => {
      const source = makeSource();
      for (const slice of source.capabilities(supported)) {
        expect(ACCOUNT_SLICES).toContain(slice);
      }
    });

    it("declares deliveries as a superset of capabilities", () => {
      const source = makeSource();
      const deliveries = source.deliveries(supported);
      for (const slice of source.capabilities(supported)) {
        expect(deliveries.has(slice)).toBe(true);
      }
    });

    it("supports the ref it declares capabilities for", () => {
      const source = makeSource();
      if (source.capabilities(supported).size > 0) {
        expect(source.supports(supported)).toBe(true);
      }
    });

    it("emits every requested slice it claims as a capability", async () => {
      const source = makeSource();
      const claimed = [...source.capabilities(supported)];
      if (claimed.length === 0) return;
      const emitted = (await collect(source, supported, claimed)).map(update => update.slice);
      for (const slice of claimed) expect(emitted).toContain(slice);
    });

    it("emits nothing outside its declared deliveries", async () => {
      const source = makeSource();
      const deliveries = source.deliveries(supported);
      const updates = await collect(source, supported, [...ACCOUNT_SLICES]);
      for (const update of updates) expect(deliveries.has(update.slice)).toBe(true);
    });

    it("emits balance rows that satisfy the entity schema", async () => {
      const source = makeSource();
      if (!source.deliveries(supported).has("balance")) return;
      const updates = await collect(source, supported, ["balance"]);
      for (const update of updates) {
        for (const balance of update.balances) {
          expect(() => AccountBalanceSchema.parse(balance)).not.toThrow();
        }
      }
    });

    it("parents every token-account balance row to the requested account", async () => {
      const source = makeSource();
      if (!source.deliveries(supported).has("balance")) return;
      const updates = await collect(source, supported, ["balance"]);
      for (const update of updates) {
        expect(update.accountId).toBe(supported.accountId);
        for (const balance of update.balances) {
          if (balance.accountId === supported.accountId) {
            expect(balance.parentId).toBeUndefined();
          } else {
            expect(balance.parentId).toBe(supported.accountId);
          }
        }
      }
    });

    if (unsupported) {
      it("declares no capability for a ref it does not support", () => {
        const source = makeSource();
        if (source.supports(unsupported)) return;
        expect([...source.capabilities(unsupported)]).toEqual([]);
      });
    }
  });
}
