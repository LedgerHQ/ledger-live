import { layoutQuickActionTiles } from "./layoutQuickActionTiles";
import type { QuickAction, QuickActionId } from "./types";

const active = (...ids: QuickActionId[]): QuickAction[] => ids.map(id => ({ id, state: "active" }));
const tileIds = (actions: readonly QuickAction[], isSendSupported = true) =>
  layoutQuickActionTiles(actions, { isSendSupported }).tiles.map(({ id }) => id);
const moreIds = (actions: readonly QuickAction[]) =>
  layoutQuickActionTiles(actions, { isSendSupported: true }).moreActions.map(({ id }) => id);

describe("layoutQuickActionTiles", () => {
  describe("swap supported", () => {
    it("Transfer · Swap · More with Buy, Sell and Earn in More", () => {
      const actions = active("transfer", "buy", "swap", "sell", "earn");

      expect(tileIds(actions)).toEqual(["transfer", "swap", "more"]);
      expect(moreIds(actions)).toEqual(["buy", "sell", "earn"]);
    });

    it("drops More when nothing goes in it", () => {
      expect(tileIds(active("transfer", "swap"))).toEqual(["transfer", "swap"]);
    });
  });

  describe("swap not supported", () => {
    it("promotes Buy and Sell to tiles, no More", () => {
      const actions = active("transfer", "buy", "sell");

      expect(tileIds(actions)).toEqual(["transfer", "buy", "sell"]);
      expect(moreIds(actions)).toEqual([]);
    });

    it("does not promote inactive actions", () => {
      const actions: QuickAction[] = [
        { id: "transfer", state: "active" },
        { id: "buy", state: "active" },
        { id: "sell", state: "inactive" },
      ];

      expect(tileIds(actions)).toEqual(["transfer", "buy"]);
    });

    it("keeps More for Earn", () => {
      const actions = active("transfer", "buy", "earn");

      expect(tileIds(actions)).toEqual(["transfer", "buy", "more"]);
      expect(moreIds(actions)).toEqual(["earn"]);
    });

    it("shows Transfer alone when nothing else is available", () => {
      expect(tileIds(active("transfer"))).toEqual(["transfer"]);
    });
  });

  it("shows Receive instead of Transfer when the currency can't send", () => {
    expect(tileIds(active("transfer", "swap"), false)).toEqual(["receive", "swap"]);
  });

  it("keeps the Transfer state on the Receive tile", () => {
    const { tiles } = layoutQuickActionTiles([{ id: "transfer", state: "inactive" }], {
      isSendSupported: false,
    });

    expect(tiles).toEqual([{ id: "receive", state: "inactive" }]);
  });
});
