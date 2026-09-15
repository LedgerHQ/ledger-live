import type { CardDetailsRoute } from "./navigation";

export type SceneSizing = "full" | "dynamic";

export const CARD_DETAILS_SCENES: Record<
  CardDetailsRoute["name"],
  Readonly<{ sizing: SceneSizing }>
> = {
  overview: { sizing: "full" },
  freeze: { sizing: "dynamic" },
  more: { sizing: "dynamic" },
};
