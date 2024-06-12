import { Account } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { fetchTronAccount } from "./api";
import { extractBandwidthInfo, getEstimatedBlockSize } from "./utils";
import { ACTIVATION_FEES } from "./constants";

export const getEstimatedFees = async (
  account: Account,
  transaction: Transaction,
  isContract: boolean,
) => {
  const feesFromAccountActivation =
    transaction.mode === "send" && !isContract
      ? await getFeesFromAccountActivation(account, transaction)
      : new BigNumber(0);

  if (feesFromAccountActivation.gt(0)) {
    return feesFromAccountActivation;
  }

  const feesFromBandwidth = getFeesFromBandwidth(account, transaction);
  return feesFromBandwidth;
};

// Special case: If activated an account, cost around 0.1 TRX
const getFeesFromAccountActivation = async (
  account: Account,
  transaction: Transaction,
): Promise<BigNumber> => {
  const recipientAccount = await fetchTronAccount(transaction.recipient);
  const { gainedUsed, gainedLimit } = extractBandwidthInfo(transaction.networkInfo);
  const available = gainedLimit.minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(account, transaction);

  if (recipientAccount.length === 0 && available.lt(estimatedBandwidthCost)) {
    return ACTIVATION_FEES; // cost is around 1 TRX
  }

  return new BigNumber(0); // no fee
};

// see : https://developers.tron.network/docs/bandwith#section-bandwidth-points-consumption
// 1. cost around 200 Bandwidth, if not enough check Free Bandwidth
// 2. If not enough, will cost some TRX
// 3. normal transfert cost around 0.002 TRX
const getFeesFromBandwidth = (account: Account, transaction: Transaction): BigNumber => {
  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = extractBandwidthInfo(
    transaction.networkInfo,
  );
  const available = freeLimit.minus(freeUsed).plus(gainedLimit).minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(account, transaction);

  if (available.lt(estimatedBandwidthCost)) {
    return new BigNumber(2000); // cost is around 0.002 TRX
  }

  return new BigNumber(0); // no fee
};
