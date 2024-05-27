import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { fetchTronAccount } from "../network";
import { ACTIVATION_FEES } from "../logic/constants";
import { getEstimatedBlockSize, extractBandwidthInfo } from "../logic/utils";

// see : https://developers.tron.network/docs/bandwith#section-bandwidth-points-consumption
// 1. cost around 200 Bandwidth, if not enough check Free Bandwidth
// 2. If not enough, will cost some TRX
// 3. normal transfert cost around 0.002 TRX
const getFeesFromBandwidth = (a: Account, t: Transaction): BigNumber => {
  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = extractBandwidthInfo(t.networkInfo);
  const available = freeLimit.minus(freeUsed).plus(gainedLimit).minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(a, t);

  if (available.lt(estimatedBandwidthCost)) {
    return new BigNumber(2000); // cost is around 0.002 TRX
  }

  return new BigNumber(0); // no fee
};

// Special case: If activated an account, cost around 0.1 TRX
const getFeesFromAccountActivation = async (a: Account, t: Transaction): Promise<BigNumber> => {
  const recipientAccount = await fetchTronAccount(t.recipient);
  const { gainedUsed, gainedLimit } = extractBandwidthInfo(t.networkInfo);
  const available = gainedLimit.minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(a, t);

  if (recipientAccount.length === 0 && available.lt(estimatedBandwidthCost)) {
    return ACTIVATION_FEES; // cost is around 1 TRX
  }

  return new BigNumber(0); // no fee
};

const getEstimatedFees = async (a: Account, t: Transaction, isContract: boolean) => {
  const feesFromAccountActivation =
    t.mode === "send" && !isContract ? await getFeesFromAccountActivation(a, t) : new BigNumber(0);

  if (feesFromAccountActivation.gt(0)) {
    return feesFromAccountActivation;
  }

  const feesFromBandwidth = getFeesFromBandwidth(a, t);
  return feesFromBandwidth;
};

export default getEstimatedFees;
