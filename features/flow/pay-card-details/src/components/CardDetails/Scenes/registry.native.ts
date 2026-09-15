import type { CardDetailsRoute } from "./navigation";

export type SceneSizing = "full" | "dynamic";

export const CARD_DETAILS_SCENES: Record<
  CardDetailsRoute["name"],
  Readonly<{ sizing: SceneSizing; hasBackButton: boolean }>
> = {
  overview: { sizing: "full", hasBackButton: false },
  freeze: { sizing: "dynamic", hasBackButton: false },
  more: { sizing: "dynamic", hasBackButton: false },
  transaction: { sizing: "full", hasBackButton: true },
};
