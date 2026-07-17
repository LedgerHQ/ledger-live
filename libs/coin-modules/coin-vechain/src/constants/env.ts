import { getEnv } from "@ledgerhq/live-env";

export const VECHAIN_NODE_URL = getEnv<string>("API_VECHAIN_THOREST");
