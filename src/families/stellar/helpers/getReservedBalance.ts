import { BigNumber } from "bignumber.js";
import StellarSdk, { ServerApi } from "stellar-sdk";
import { BalanceAsset } from "../types";

export const getReservedBalance = (
  account: ServerApi.AccountRecord
): BigNumber => {
  const BASE_RESERVE_MIN_COUNT = new BigNumber(2);
  const BASE_RESERVE = new BigNumber(StellarSdk.BASE_RESERVE);
  const numOfSponsoringEntries = Number(account.num_sponsoring);
  const numOfSponsoredEntries = Number(account.num_sponsored);

  const nativeAsset = account.balances.find(
    (b) => b.asset_type === "native"
  ) as BalanceAsset;

  if (!nativeAsset) {
    // This is unlikely
    // TODO: translate error message
    throw new Error("Something went wrong, native asset was not found");
  }

  const amountInOffers = new BigNumber(nativeAsset.buying_liabilities);
  const numOfEntries = new BigNumber(account.subentry_count);

  return BASE_RESERVE_MIN_COUNT.plus(numOfEntries)
    .plus(numOfSponsoringEntries)
    .minus(numOfSponsoredEntries)
    .times(BASE_RESERVE)
    .plus(amountInOffers);
};
