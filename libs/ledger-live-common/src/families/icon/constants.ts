import { getEnv } from "../../env";

export const ICON_API_ENDPOINT = getEnv("ICON_API_ENDPOINT");
export const ICON_TESTNET_API_ENDPOINT = getEnv("ICON_TESTNET_API_ENDPOINT");
export const ICON_TESTNET_RPC_ENDPOINT = getEnv("ICON_TESTNET_RPC_ENDPOINT");
export const ICON_RPC_ENDPOINT = getEnv("ICON_RPC_ENDPOINT");
export const GOVERNANCE_SCORE_ADDRESS =
  "cx0000000000000000000000000000000000000001";
export const IISS_SCORE_ADDRESS =
  "cx0000000000000000000000000000000000000000";
export const LIMIT = 20;
export const BERLIN_TESTNET_NID = 2;
export const MAINNET_NID = 1;
export const STEP_LIMIT = 200000;
export const I_SCORE_UNIT = 1000;

export const PREP_TYPE = {
  MAIN: 'Main P-Rep',
  SUB: 'Sub P-Rep',
  CANDIDATE: 'Candidate'
}