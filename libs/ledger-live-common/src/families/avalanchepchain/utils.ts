import type { Account } from "../../types";
import BinTools from "avalanche/dist/utils/bintools";

export const binTools = BinTools.getInstance();

export const AVAX_HRP = "fuji"; //"fuji" for testnet, "avax" for mainnet

export const FIGMENT_AVALANCHE_VALIDATOR_NODES = [
  "NodeID-GW7CvXwkPFDsfFHrix1SA148NHF5ZnSXs",
  "NodeID-CRg2AxBCkLjY6T7oiS7ijrCFsdAVmPNuY",
];

export const ONE_AVAX = 1000000000;
export const AVAX_MINIMUM_STAKE_AMOUNT = 1000000000; //fuji testnet
// export const AVAX_MINIMUM_STAKE_AMOUNT = 25000000000; //mainnet

export const isDefaultValidatorNode = (nodeID: string): boolean =>
  FIGMENT_AVALANCHE_VALIDATOR_NODES.includes(nodeID);

export const canDelegate = (account: Account) =>
  account.spendableBalance.gt(AVAX_MINIMUM_STAKE_AMOUNT);

export const MINUTE = 60;
export const FIVE_MINUTES = MINUTE * 5;
export const FIFTEEN_MINUTES = MINUTE * 15;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const YEAR = DAY * 365;
export const TWO_WEEKS = DAY * 14;
export const THREE_WEEKS = DAY * 21;
