import type { CardDetailsRoute } from "./navigation";

export type SceneSizing = "full" | "dynamic";

export const CARD_DETAILS_SCENES: Record<
  CardDetailsRoute["name"],
  Readonly<{ sizing: SceneSizing; scrollable: boolean; hasBackButton: boolean }>
> = {
  overview: { sizing: "full", scrollable: true, hasBackButton: false },
  freeze: { sizing: "dynamic", scrollable: true, hasBackButton: false },
  more: { sizing: "dynamic", scrollable: true, hasBackButton: true },
  addToWallet: { sizing: "dynamic", scrollable: true, hasBackButton: true },
  transaction: { sizing: "full", scrollable: false, hasBackButton: true },
  assetDetails: { sizing: "full", scrollable: false, hasBackButton: true },
  assetWithdraw: { sizing: "dynamic", scrollable: true, hasBackButton: true },
  assetsManage: { sizing: "dynamic", scrollable: false, hasBackButton: true },
  assetTransaction: { sizing: "full", scrollable: false, hasBackButton: true },
};
