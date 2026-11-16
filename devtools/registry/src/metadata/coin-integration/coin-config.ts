import { Category, ToolKind, type ToolMetadata } from "../../types";
export type { CoinConfigToolProps } from "@devtools/coin-config";

export const coinConfig: ToolMetadata = {
  label: "coin-config",
  kind: ToolKind.SHARED,
  category: Category.CONFIGURATION,
  owner: "Coin Integration",
  desc: "Override LiveConfig values, such as the config_currency_* coin configs. Applied right away, kept across restarts.",
  loader: () => import("@devtools/coin-config").then(({ CoinConfig }) => ({ default: CoinConfig })),
};
