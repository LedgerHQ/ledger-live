import { convertLoopToIcx } from "./logic";

export const GOVERNANCE_SCORE_ADDRESS = "cx0000000000000000000000000000000000000001";
export const IISS_SCORE_ADDRESS = "cx0000000000000000000000000000000000000000";
export const LIMIT = 20;
export const BERLIN_TESTNET_NID = 7;
export const MAINNET_NID = 1;
export const STEP_LIMIT = 200000;
export const I_SCORE_UNIT = 1000;
export const RPC_VERSION = 3;

export const PREP_TYPE = {
  MAIN: "Main P-Rep",
  SUB: "Sub P-Rep",
  CANDIDATE: "Candidate",
};

export const TRANSACTION_FEE = convertLoopToIcx(Math.pow(10, 15));
