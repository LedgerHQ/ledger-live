import BigNumber from "bignumber.js";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { fetchTronAccount } from "../network";
import { ACTIVATION_FEES, ACTIVATION_FEES_TRC_20, STANDARD_FEES_TRC_20 } from "../logic/constants";
import { getEstimatedBlockSize, extractBandwidthInfo } from "../logic/utils";

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

// Special case: If activated an account, cost around 0.1 TRX
const getFeesFromAccountActivation = async (
  a: Account,
  t: Transaction,
  ta?: TokenAccount | null,
): Promise<BigNumber> => {
  const [recipientAccount]: [undefined | { trc20?: Record<string, string>[] }] =
    await fetchTronAccount(t.recipient);
  const { gainedUsed, gainedLimit } = extractBandwidthInfo(t.networkInfo);
  const available = gainedLimit.minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(a, t);

  const hasTRC20 = Boolean(
    ta && recipientAccount?.trc20?.some(trc20 => ta.token.contractAddress in trc20),
  );

  if (!recipientAccount && !hasTRC20 && available.lt(estimatedBandwidthCost)) {
    // if we have a token account but the recipient is either not active or the account does not have a trc20 balance for the given token.
    if (ta && ta.token.tokenType === "trc20") {
      return ACTIVATION_FEES_TRC_20; // cost is 27.6009 TRX
    }
    // if no token account then we are sending tron use the default activation fees.
    if (!ta) {
      return ACTIVATION_FEES; // cost is around 1 TRX
    }
  }

  // if account is activated and it does already have a trc20 balance for given token.
  if (ta && ta.token.tokenType === "trc20") {
    return STANDARD_FEES_TRC_20; // cost is 13.3959 TRX
  }

  return new BigNumber(0); // no fee
};

const getEstimatedFees = async (
  a: Account,
  t: Transaction,
  _isContract: boolean,
  ta?: TokenAccount | null,
) => {
  const feesFromAccountActivation =
    t.mode === "send" ? await getFeesFromAccountActivation(a, t, ta) : new BigNumber(0);
  if (feesFromAccountActivation.gt(0)) {
    return feesFromAccountActivation;
  }

  const feesFromBandwidth = getFeesFromBandwidth(a, t);
  return feesFromBandwidth;
};

export default getEstimatedFees;
