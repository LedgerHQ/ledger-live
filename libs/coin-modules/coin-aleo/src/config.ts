import buildCoinConfig from "@ledgerhq/coin-framework/config";
import type { AleoCoinConfig } from "./types";

const coinConfig = buildCoinConfig<AleoCoinConfig>();

export default coinConfig;
