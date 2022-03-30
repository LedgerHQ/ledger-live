import { BigNumber } from "bignumber.js";
import { ServerApi } from "stellar-sdk";
import { BASE_RESERVE, BASE_RESERVE_MIN_COUNT } from "./api";
import { BalanceAsset } from "./types";

export const getReservedBalance = (
  account: ServerApi.AccountRecord
): BigNumber => {
  const numOfSponsoringEntries = Number(account.num_sponsoring);
  const numOfSponsoredEntries = Number(account.num_sponsored);

  const nativeAsset = account.balances?.find(
    (b) => b.asset_type === "native"
  ) as BalanceAsset;

  const amountInOffers = new BigNumber(nativeAsset?.buying_liabilities || 0);
  const numOfEntries = new BigNumber(account.subentry_count);

  return new BigNumber(BASE_RESERVE_MIN_COUNT)
    .plus(numOfEntries)
    .plus(numOfSponsoringEntries)
    .minus(numOfSponsoredEntries)
    .times(BASE_RESERVE)
    .plus(amountInOffers);
};
