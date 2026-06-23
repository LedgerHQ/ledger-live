import { getEnv } from "@ledgerhq/live-env";

export const STAKING_ADDRESS_INDEX = 0;
export const TTL_GAP = 7200;
export const CARDANO_PURPOSE = 1852;
export const CARDANO_COIN_TYPE = 1815;
export const MEMO_LABEL = 674;
export const CARDANO_MAX_SUPPLY = 45e9;

export const CARDANO_API_ENDPOINT = getEnv("CARDANO_API_ENDPOINT");
export const CARDANO_TESTNET_API_ENDPOINT = getEnv("CARDANO_TESTNET_API_ENDPOINT");

// Current-epoch protocol params (a0/rho/tau, +reserves & active stake once exposed) for validator
// APY — ADR-038 Option 3, served by Ledger's internal Cardano node (LIVE-18622). Distinct host from
// the Strica API above.
export const CARDANO_EPOCH_PARAMS_ENDPOINT = getEnv("CARDANO_EPOCH_PARAMS_ENDPOINT");
export const CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT = getEnv(
  "CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT",
);

export const CARDANO_DUMMY_ADDRESS =
  "addr1qykrup76qz622wxgmqtuumr6mn3vvkqc4jgxj6ytqudchccayfawlf9hwv2fzuygt2km5v92kvf8e3s3mk7ynxw77cwq80z2rm";
