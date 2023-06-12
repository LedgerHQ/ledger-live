import { getEnv } from "../../env";

export const STAKING_ADDRESS_INDEX = 0;
export const TTL_GAP = 7200;
export const CARDANO_PURPOSE = 1852;
export const CARDANO_COIN_TYPE = 1815;
export const MEMO_LABEL = 674;

export const CARDANO_API_ENDPOINT = getEnv("CARDANO_API_ENDPOINT");
export const CARDANO_TESTNET_API_ENDPOINT = getEnv("CARDANO_TESTNET_API_ENDPOINT");
