import { getEnv } from "../../env";

export const MAINNET = 0;
export const TESTNET = 16;

export const MEMO_MAX_BYTES = 8;

export const HELIUM_API_ENDPOINT = getEnv("HELIUM_API_ENDPOINT");

export const HELIUM_STAGING_API_ENDPOINT = getEnv(
  "HELIUM_STAGING_API_ENDPOINT"
);

export const HELIUM_TESTNET_API_ENDPOINT = getEnv(
  "HELIUM_TESTNET_API_ENDPOINT"
);

export const HELIUM_DEVNET_API_ENDPOINT = getEnv("HELIUM_DEVNET_API_ENDPOINT");
