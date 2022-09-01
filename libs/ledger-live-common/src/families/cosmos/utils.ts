// Import here other Cosmos-based Ledger Validators
import type { AccountLike } from "@ledgerhq/types-live";
import { LEDGER_OSMOSIS_VALIDATOR_ADDRESS } from "../osmosis/utils";
import { CosmosAccount } from "./types";

export const LEDGER_VALIDATOR_ADDRESS =
  "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm";

export const COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES = [
  LEDGER_VALIDATOR_ADDRESS,
  LEDGER_OSMOSIS_VALIDATOR_ADDRESS,
];

export function isCosmosAccount(
  account?: AccountLike | null
): account is CosmosAccount {
  return (account as CosmosAccount)?.cosmosResources !== undefined;
}
