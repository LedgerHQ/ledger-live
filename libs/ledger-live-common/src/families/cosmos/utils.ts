// Import here other Cosmos-based Ledger Validators
import type { AccountLike } from "@ledgerhq/types-live";
import { CosmosAccount } from "./types";

export const LEDGER_VALIDATOR_ADDRESS =
  "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm";

export const LEDGER_OSMOSIS_VALIDATOR_ADDRESS =
  "osmovaloper17cp6fxccqxrpj4zc00w2c7u6y0umc2jajsyc5t";

export const COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES = [
  LEDGER_VALIDATOR_ADDRESS,
  LEDGER_OSMOSIS_VALIDATOR_ADDRESS,
];

export function isCosmosAccount(
  account?: AccountLike | null
): account is CosmosAccount {
  return (account as CosmosAccount)?.cosmosResources !== undefined;
}
