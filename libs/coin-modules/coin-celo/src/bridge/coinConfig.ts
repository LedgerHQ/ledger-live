import { type CeloConfigInfo, getCoinConfig } from "../config";

/** The coin config the account bridge resolves its endpoints from (the api path uses its context). */
export const bridgeCoinConfig = (): CeloConfigInfo => getCoinConfig("celo").info;
