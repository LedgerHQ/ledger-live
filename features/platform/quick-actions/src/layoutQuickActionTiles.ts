import type { QuickAction, QuickActionId, QuickActionState } from "./types";

export type QuickActionTileId = "transfer" | "receive" | "swap" | "buy" | "sell" | "more";

export type QuickActionTile = Readonly<{ id: QuickActionTileId; state: QuickActionState }>;

export type QuickActionTilesLayout = Readonly<{
  tiles: readonly QuickActionTile[];
  moreActions: readonly QuickAction[];
}>;

type Options = Readonly<{ isSendSupported: boolean }>;

type PromotableAction = QuickAction & Readonly<{ id: "buy" | "sell" }>;

const MORE_ACTION_IDS: ReadonlySet<QuickActionId> = new Set(["buy", "sell", "earn"]);

const isActivePromotable = (action: QuickAction): action is PromotableAction =>
  (action.id === "buy" || action.id === "sell") && action.state === "active";

function transferTiles(
  actions: readonly QuickAction[],
  isSendSupported: boolean,
): QuickActionTile[] {
  const transfer = actions.find(({ id }) => id === "transfer");
  if (!transfer) return [];
  return [{ id: isSendSupported ? "transfer" : "receive", state: transfer.state }];
}

function moreTiles(moreActions: readonly QuickAction[]): QuickActionTile[] {
  return moreActions.length > 0 ? [{ id: "more", state: "active" }] : [];
}

/**
 * Mobile tile layout for the asset / account scopes, from `resolveQuickActions`.
 * Swap supported: Transfer · Swap · More (Buy, Sell, Earn in More).
 * Swap not supported: active Buy / Sell become tiles; More only remains for Earn.
 * Transfer shows as Receive when the currency can't send.
 */
export function layoutQuickActionTiles(
  actions: readonly QuickAction[],
  { isSendSupported }: Options,
): QuickActionTilesLayout {
  const transfer = transferTiles(actions, isSendSupported);
  const swap = actions.find(({ id }) => id === "swap");

  if (swap) {
    const moreActions = actions.filter(({ id }) => MORE_ACTION_IDS.has(id));
    return {
      tiles: [...transfer, { id: "swap", state: swap.state }, ...moreTiles(moreActions)],
      moreActions,
    };
  }

  const promoted = actions.filter(isActivePromotable);
  const moreActions = actions.filter(({ id }) => id === "earn");
  return { tiles: [...transfer, ...promoted, ...moreTiles(moreActions)], moreActions };
}
