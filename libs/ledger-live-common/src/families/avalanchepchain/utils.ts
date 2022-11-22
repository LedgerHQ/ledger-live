import type { Account } from "@ledgerhq/types-live";
import BinTools from "avalanche/dist/utils/bintools";

export const binTools = BinTools.getInstance();

export const AVAX_HRP = "avax";

export const FIGMENT_AVALANCHE_VALIDATOR_NODES = [
  "NodeID-GtF9Gx4mbkqq35LPdoDe8iPft7nZ48Hkn",
];

export const ONE_AVAX = 1000000000;
export const AVAX_MINIMUM_STAKE_AMOUNT = 25000000000;

export const isDefaultValidatorNode = (nodeID: string): boolean =>
  FIGMENT_AVALANCHE_VALIDATOR_NODES.includes(nodeID);

export const canDelegate = (account: Account) =>
  account.spendableBalance.gt(AVAX_MINIMUM_STAKE_AMOUNT);

export const getReadableDate = (unixTimestamp: number, locale: string) =>
  new Date(unixTimestamp * 1000).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const MINUTE = 60;
export const FIVE_MINUTES = MINUTE * 5;
export const FIFTEEN_MINUTES = MINUTE * 15;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const YEAR = DAY * 365;
export const TWO_WEEKS = DAY * 14;
export const THREE_WEEKS = DAY * 21;
