import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import { getAccountCurrency, getFeesUnit } from "@ledgerhq/ledger-wallet-framework/account";
import BigNumber from "bignumber.js";
import sumBy from "lodash/sumBy";
import { ONE_TRX } from "../logic/constants";
import { validateAddress } from "../logic/validateAddress";
import {
  fetchTronAccount,
  fetchTronContract,
  getDelegatedResource,
  getTronSuperRepresentatives,
} from "../network";
import { Transaction, TransactionStatus, TronAccount } from "../types";
import {
  TronInvalidFreezeAmount,
  TronInvalidUnDelegateResourceAmount,
  TronInvalidVoteCount,
  TronLegacyUnfreezeNotExpired,
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronNoReward,
  TronNotEnoughEnergy,
  TronNotEnoughTronPower,
  TronNoUnfrozenResource,
  TronRewardNotAvailable,
  TronSendTrc20ToNewAccountForbidden,
  TronUnexpectedFees,
  TronUnfreezeNotExpired,
  TronVoteRequired,
} from "../types/errors";
import getEstimatedFees, { getFeeResourceBreakdown } from "./getEstimateFees";

const getTransactionStatus = async (
  acc: TronAccount,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const { family, mode, recipient, resource, votes, useAllAmount = false } = transaction;
  const tokenAccount = !transaction.subAccountId
    ? null
    : acc.subAccounts && acc.subAccounts.find(ta => ta.id === transaction.subAccountId);
  const account = tokenAccount || acc;
  const isContractInteraction =
    (await fetchTronContract(tokenAccount ? tokenAccount.token.contractAddress : recipient)) !==
    undefined;

  if (mode === "send" && !recipient) {
    errors.recipient = new RecipientRequired();
  }

  if (["send", "unDelegateResource", "legacyUnfreeze"].includes(mode)) {
    if (recipient === acc.freshAddress) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else if (recipient && !(await validateAddress(recipient, {}))) {
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: acc.currency.name,
      });
    } else if (
      recipient &&
      mode === "send" &&
      account.type === "TokenAccount" &&
      account.token.tokenType === "trc20" &&
      !isContractInteraction && // send trc20 to a smart contract is allowed
      (await fetchTronAccount(recipient)).length === 0
    ) {
      // send trc20 to a new account is forbidden by us (because it will not activate the account)
      errors.recipient = new TronSendTrc20ToNewAccountForbidden();
    }
  }

  if (mode === "unfreeze") {
    const { bandwidth, energy } = acc.tronResources.frozen;
    if (resource === "BANDWIDTH" && transaction.amount.gt(bandwidth?.amount || new BigNumber(0))) {
      errors.resource = new TronNoFrozenForBandwidth();
    } else if (resource === "ENERGY" && transaction.amount.gt(energy?.amount || new BigNumber(0))) {
      errors.resource = new TronNoFrozenForEnergy();
    }
  }

  if (mode === "legacyUnfreeze") {
    const now = new Date();
    const expirationDate =
      resource === "ENERGY"
        ? acc.tronResources.legacyFrozen.energy?.expiredAt
        : acc.tronResources.legacyFrozen.bandwidth?.expiredAt;

    if (!expirationDate) {
      if (resource === "BANDWIDTH") {
        errors.resource = new TronNoFrozenForBandwidth();
      } else {
        errors.resource = new TronNoFrozenForEnergy();
      }
    } else if (now.getTime() < expirationDate.getTime()) {
      errors.resource = new TronLegacyUnfreezeNotExpired();
    }
  }

  if (mode === "withdrawExpireUnfreeze") {
    const now = new Date();
    if (
      (!acc.tronResources.unFrozen.bandwidth ||
        acc.tronResources.unFrozen.bandwidth.length === 0) &&
      (!acc.tronResources.unFrozen.energy || acc.tronResources.unFrozen.energy.length === 0)
    ) {
      errors.resource = new TronNoUnfrozenResource();
    } else {
      const unfreezingResources = [
        ...(acc.tronResources.unFrozen.bandwidth ?? []),
        ...(acc.tronResources.unFrozen.energy ?? []),
      ];

      const hasNoExpiredResource = !unfreezingResources.some(
        unfrozen => unfrozen.expireTime.getTime() <= now.getTime(),
      );

      if (hasNoExpiredResource) {
        const closestExpireTime = unfreezingResources.reduce((closest, current) => {
          if (!closest) {
            return current;
          }
          const closestTimeDifference = Math.abs(closest.expireTime.getTime() - now.getTime());
          const currentTimeDifference = Math.abs(current.expireTime.getTime() - now.getTime());

          return currentTimeDifference < closestTimeDifference ? current : closest;
        });
        errors.resource = new TronUnfreezeNotExpired(undefined, {
          time: closestExpireTime.expireTime.toISOString(),
        });
      }
    }
  }

  if (mode === "unDelegateResource" && resource && acc.tronResources) {
    const delegatedResourceAmount = await getDelegatedResource(acc, transaction, resource);
    if (delegatedResourceAmount.lt(transaction.amount)) {
      errors.resource = new TronInvalidUnDelegateResourceAmount();
    }
  }

  if (mode === "vote") {
    if (votes.length === 0) {
      errors.vote = new TronVoteRequired();
    } else {
      const superRepresentatives = await getTronSuperRepresentatives();
      const isValidVoteCounts = votes.every(v => v.voteCount > 0);
      const isValidAddresses = votes.every(v =>
        superRepresentatives.some(s => s.address === v.address),
      );

      if (!isValidAddresses) {
        errors.vote = new InvalidAddress("", {
          currencyName: acc.currency.name,
        });
      } else if (!isValidVoteCounts) {
        errors.vote = new TronInvalidVoteCount();
      } else {
        const totalVoteCount = sumBy(votes, "voteCount");
        const tronPower = (acc.tronResources && acc.tronResources.tronPower) || 0;

        if (totalVoteCount > tronPower) {
          errors.vote = new TronNotEnoughTronPower();
        }
      }
    }
  }

  if (mode === "claimReward") {
    const lastRewardOp = account.operations.find(o => o.type === "REWARD");
    const claimableRewardDate = lastRewardOp
      ? new Date(lastRewardOp.date.getTime() + 24 * 60 * 60 * 1000) // date + 24 hours
      : new Date();

    if (acc.tronResources && acc.tronResources.unwithdrawnReward.eq(0)) {
      errors.reward = new TronNoReward();
    } else if (lastRewardOp && claimableRewardDate.valueOf() > new Date().valueOf()) {
      errors.reward = new TronRewardNotAvailable("Reward is not claimable", {
        until: claimableRewardDate.toISOString(),
      });
    }
  }

  // Only when no error has been detected so far (the recipient/resource checks above): compute the
  // breakdown once and reuse it for both the status fields and the fee, so they can't disagree.
  // (Amount validation runs later; the zero-amount case is guarded inside getFeeResourceBreakdown.)
  const hasErrors = Object.entries(errors).length > 0;
  let energyRequired = new BigNumber(0);
  let energyAvailable = new BigNumber(0);
  let bandwidthRequired = new BigNumber(0);
  let bandwidthAvailable = new BigNumber(0);
  let estimatedFees = new BigNumber(0);

  if (!hasErrors) {
    const resourceBreakdown = await getFeeResourceBreakdown(acc, transaction, tokenAccount);
    energyRequired = resourceBreakdown.energyRequired;
    energyAvailable = resourceBreakdown.energyAvailable;
    bandwidthRequired = resourceBreakdown.bandwidthRequired;
    bandwidthAvailable = resourceBreakdown.bandwidthAvailable;
    estimatedFees = await getEstimatedFees(acc, transaction, tokenAccount, resourceBreakdown);
  }

  const balance =
    account.type === "Account"
      ? BigNumber.max(0, account.spendableBalance.minus(estimatedFees))
      : account.balance;
  const amount = useAllAmount ? balance : transaction.amount;
  const amountSpent = ["send", "freeze", "undelegateResource"].includes(mode)
    ? amount
    : new BigNumber(0);

  if (mode === "freeze" && amount.lt(ONE_TRX)) {
    errors.amount = new TronInvalidFreezeAmount();
  }

  // fees are applied in the parent only (TRX)
  const totalSpent = account.type === "Account" ? amountSpent.plus(estimatedFees) : amountSpent;

  if (["send", "freeze"].includes(mode)) {
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }
    if (amountSpent.eq(0)) {
      errors.amount = useAllAmount ? new NotEnoughBalance() : new AmountRequired();
    } else if (amount.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }

    // Warn when the real energy requirement exceeds available energy (replaces the former
    // hardcoded-47619 heuristic).
    if (
      account.type === "TokenAccount" &&
      account.token.tokenType === "trc20" &&
      energyRequired.gt(energyAvailable)
    ) {
      warnings.amount = new TronNotEnoughEnergy();
    }
  }

  if (!errors.recipient && estimatedFees.gt(0)) {
    const fees = formatCurrencyUnit(getAccountCurrency(acc).units[0], estimatedFees, {
      showCode: true,
      disableRounding: true,
    });
    warnings.fee = new TronUnexpectedFees("Estimated fees", {
      fees,
    });
  }

  const parentAccountBalance = account.type === "Account" ? account.balance : acc.spendableBalance;
  //
  // Not enough gas check
  // PTX swap uses this to support deeplink to buy additional currency.
  // Only require TRX when a fee is actually owed: an energy-aware TRC20 transfer covered by the
  // account's staked resources costs 0 TRX, so a zero-balance account can still broadcast it.
  //
  if (
    parentAccountBalance.lt(estimatedFees) ||
    (parentAccountBalance.isZero() && estimatedFees.gt(0))
  ) {
    const query = new URLSearchParams({
      ...(acc?.id ? { account: acc.id } : {}),
    });
    errors.gasLimit = new NotEnoughGas(undefined, {
      fees: formatCurrencyUnit(getFeesUnit(acc.currency), estimatedFees),
      ticker: acc.currency.ticker,
      cryptoName: acc.currency.name,
      links: [`ledgerlive://buy?${query.toString()}`],
    });
  }

  return Promise.resolve({
    errors,
    warnings,
    amount: amountSpent,
    estimatedFees,
    totalSpent,
    family,
    energyRequired,
    energyAvailable,
    bandwidthRequired,
    bandwidthAvailable,
  });
};

export default getTransactionStatus;
