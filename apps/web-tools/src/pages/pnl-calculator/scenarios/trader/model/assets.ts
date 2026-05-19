import { BTC, ETH, SAT, WEI } from "@ledgerhq/wallet-pnl/scenarios";
import type { AssetDescriptor, TraderAssetId, TraderOpKind } from "./types";

const ASSETS: Record<TraderAssetId, AssetDescriptor> = {
  BTC: {
    id: "BTC",
    ticker: "BTC",
    currency: BTC,
    defaultLatestPrice: "65000",
    defaultAmount: "0.05",
    defaultPrice: "60000",
    atomicScale: SAT,
    isToken: false,
  },
  ETH: {
    id: "ETH",
    ticker: "ETH",
    currency: ETH,
    defaultLatestPrice: "3000",
    defaultAmount: "1",
    defaultPrice: "2500",
    atomicScale: WEI,
    isToken: false,
  },
};

export const TRADER_ASSET_IDS: readonly TraderAssetId[] = ["BTC", "ETH"] as const;
export const TRADER_OP_KINDS: readonly TraderOpKind[] = ["IN", "OUT", "FEES"] as const;

export function getAsset(id: TraderAssetId): AssetDescriptor {
  return ASSETS[id];
}
