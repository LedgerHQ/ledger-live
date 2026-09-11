import * as networkModule from "@ledgerhq/live-network/network";
import { listOperations } from "../listOperations";
import type { BitcoinContext } from "../../api/config";

const XPUB =
  "xpub6CCc6taSdhLfwHhSyrkHh1fc2CgvDAbezeM5wunWfs7tCH26ysNK8nvoyAzBTBM38NbYSFehwwnZRAYHkBB9JM3gC8eJ2n5CNJgjX7Srdse";
const DERIVATION_PATH = "84'/0'/0'/0";
const CURRENCY = "bitcoin";

const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

const netSpy = jest.spyOn(networkModule, "default");
const reset = () => netSpy.mockClear();
const reqs = () => netSpy.mock.calls.length;

describe("listOperations — a page is fetched WITHOUT syncing the entire history", () => {
  it("paginates the account with a small, constant, depth-independent per-page cost", async () => {
    // Ground truth: the whole account in one call.
    const full = await listOperations(context, CURRENCY, XPUB, {
      minHeight: 0,
      derivationPath: DERIVATION_PATH,
      limit: 100_000,
    });
    const total = full.items.length;
    const L = Math.max(1, Math.ceil(total / 4));

    full.items.forEach(op => {
      expect(typeof op.value).toBe("bigint");
      expect(op.asset).toEqual({ type: "native" });
      expect(op.tx.hash.length).toBeGreaterThan(0);
      expect(["IN", "OUT"]).toContain(op.type);
    });

    const pages: { cursorIn: string | undefined; ids: string[]; reqs: number }[] = [];
    let cursor: string | undefined;
    let p = 0;
    do {
      p += 1;
      reset();
      const cursorIn = cursor;
      const page = await listOperations(context, CURRENCY, XPUB, {
        minHeight: 0,
        derivationPath: DERIVATION_PATH,
        limit: L,
        cursor: cursorIn,
      });
      pages.push({ cursorIn, ids: page.items.map(o => o.id), reqs: reqs() });
      cursor = page.next;
    } while (cursor !== undefined && p < total + 5);

    const walkedIds = pages.flatMap(pg => pg.ids);
    const nonEmpty = pages.filter(pg => pg.ids.length > 0);
    const deep = nonEmpty[nonEmpty.length - 1];

    // Jump straight to the deepest page from its cursor.
    reset();
    const jumped = await listOperations(context, CURRENCY, XPUB, {
      minHeight: 0,
      derivationPath: DERIVATION_PATH,
      limit: L,
      cursor: deep.cursorIn,
    });
    const jumpReqs = reqs();
    const jumpMatches =
      jumped.items.length === deep.ids.length && jumped.items.every((o, i) => o.id === deep.ids[i]);

    const sameOrder =
      walkedIds.length === total && walkedIds.every((id, i) => id === full.items[i].id);
    const cursoredReqs = pages.slice(1).map(pg => pg.reqs);

    expect(sameOrder).toBe(true); // pagination reconstructs the whole account
    expect(jumpMatches).toBe(true); // a directly-jumped deep page is correct
    expect(cursoredReqs.every(r => r <= 4)).toBe(true); // small constant, independent of depth
    expect(jumpReqs).toBeLessThanOrEqual(4); // no full resync to reach a deep page
  }, 240_000);
});
