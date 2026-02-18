import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { estimateFees, getAccount } from "../logic";
import { ACTIVATION_FEES, STANDARD_FEES_NATIVE, STANDARD_FEES_TRC_20 } from "../logic/constants";
import type { AccountTronAPI } from "../network/types";
import type { Transaction } from "../types";
import { extractBandwidthInfo, getEstimatedBlockSize } from "./utils";

// see : https://developers.tron.network/docs/bandwith#section-bandwidth-points-consumption
// 1. cost around 200 Bandwidth, if not enough check Free Bandwidth
// 2. If not enough, will cost some TRX
// 3. normal transfert cost around 0.270 TRX
const getFeesFromBandwidth = (account: Account, transaction: Transaction): BigNumber => {
  const { freeUsed, freeLimit, gainedUsed, gainedLimit } = extractBandwidthInfo(
    transaction.networkInfo,
  );
  const available = freeLimit.minus(freeUsed).plus(gainedLimit).minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(account, transaction);

  if (available.lt(estimatedBandwidthCost)) {
    return STANDARD_FEES_NATIVE; // cost is around 0.270 TRX
  }

  return new BigNumber(0); // no fee
};

// Special case: If activated an account, cost around 0.1 TRX
const getFeesFromAccountActivation = async (
  account: Account,
  transaction: Transaction,
  tokenAccount?: TokenAccount | null,
): Promise<BigNumber> => {
  const recipientAccounts = await getAccount(transaction.recipient);
  const recipientAccount: AccountTronAPI | undefined = recipientAccounts[0];
  const { gainedUsed, gainedLimit } = extractBandwidthInfo(transaction.networkInfo);
  const available = gainedLimit.minus(gainedUsed);
  const estimatedBandwidthCost = getEstimatedBlockSize(account, transaction);

  const hasTRC20 = Boolean(
    tokenAccount &&
      recipientAccount?.trc20?.some(trc20 => tokenAccount.token.contractAddress in trc20),
  );

  if (!recipientAccount && !hasTRC20 && available.lt(estimatedBandwidthCost)) {
    // if no token account then we are sending tron use the default activation fees.
    if (!tokenAccount) {
      return ACTIVATION_FEES; // cost is around 1 TRX
    }

    const transactionIntent: TransactionIntent = {
      intentType: "transaction",
      type: transaction.mode,
      sender: account.freshAddress,
      recipient: transaction.recipient,
      amount: BigInt(transaction.amount.toString()),
      asset:
        tokenAccount?.token.tokenType === "trc20"
          ? {
              type: "trc20",
              assetReference: tokenAccount.token.contractAddress,
            }
          : { type: "trc10", assetReference: tokenAccount?.token.id },
    };

    // if we have a token account but the recipient is either not active or the account does not have a trc20 balance for the given token.
    if (tokenAccount && tokenAccount.token.tokenType === "trc20") {
      const estimatedFees = await estimateFees(transactionIntent);
      return new BigNumber(estimatedFees.toString());
    }
  }

  // if account is activated and it does already have a trc20 balance for given token.
  if (tokenAccount && tokenAccount.token.tokenType === "trc20") {
    return STANDARD_FEES_TRC_20; // cost is 13.3959 TRX
  }

  return new BigNumber(0); // no fee
};

const getEstimatedFees = async (
  account: Account,
  transaction: Transaction,
  tokenAccount?: TokenAccount | null,
) => {
  const feesFromAccountActivation =
    transaction.mode === "send"
      ? await getFeesFromAccountActivation(account, transaction, tokenAccount)
      : new BigNumber(0);
  if (feesFromAccountActivation.gt(0)) {
    return feesFromAccountActivation;
  }

  const feesFromBandwidth = getFeesFromBandwidth(account, transaction);
  return feesFromBandwidth;
};

export default getEstimatedFees;
