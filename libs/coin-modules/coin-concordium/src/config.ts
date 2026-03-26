import buildCoinConfig from "@ledgerhq/coin-module-framework/config";
import type { ConcordiumCoinConfig } from "./types/config";

export type { ConcordiumCoinConfig } from "./types/config";

const { setCoinConfig, getCoinConfig } = buildCoinConfig<ConcordiumCoinConfig>();

export default { setCoinConfig, getCoinConfig };
