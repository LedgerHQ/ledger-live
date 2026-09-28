import type { CardDetailsRoute } from "./navigation";

export type SceneSizing = "full" | "dynamic";

export const CARD_DETAILS_SCENES: Record<
  CardDetailsRoute["name"],
  Readonly<{ sizing: SceneSizing; hasBackButton: boolean }>
> = {
  overview: { sizing: "full", hasBackButton: false },
  freeze: { sizing: "dynamic", hasBackButton: false },
  more: { sizing: "dynamic", hasBackButton: true },
  addToWallet: { sizing: "dynamic", hasBackButton: true },
  transaction: { sizing: "full", hasBackButton: true },
  assetDetails: { sizing: "full", hasBackButton: true },
  assetWithdraw: { sizing: "dynamic", hasBackButton: true },
  assetsManage: { sizing: "full", hasBackButton: true },
  assetTransaction: { sizing: "full", hasBackButton: true },
};
