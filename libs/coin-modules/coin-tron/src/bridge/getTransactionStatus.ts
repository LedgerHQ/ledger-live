import { getAccountCurrency } from "@ledgerhq/coin-framework/account";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import BigNumber from "bignumber.js";
import sumBy from "lodash/sumBy";
import { ONE_TRX } from "../logic/constants";
import {
  fetchTronAccount,
  fetchTronContract,
  getContractUserEnergyRatioConsumption,
  getDelegatedResource,
  getTronSuperRepresentatives,
  validateAddress,
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
import getEstimatedFees from "./getEstimateFees";
import get from "lodash/get";

const getTransactionStatus = async (a: TronAccount, t: Transaction): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const { family, mode, recipient, resource, votes, useAllAmount = false } = t;
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find(ta => ta.id === t.subAccountId);
  const account = tokenAccount || a;
  const isContractAddressRecipient = (await fetchTronContract(recipient)) !== undefined;

  if (mode === "send" && !recipient) {
    errors.recipient = new RecipientRequired();
  }

  if (["send", "unDelegateResource", "legacyUnfreeze"].includes(mode)) {
    if (recipient === a.freshAddress) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else if (recipient && !(await validateAddress(recipient))) {
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: a.currency.name,
      });
    } else if (
      recipient &&
      mode === "send" &&
      account.type === "TokenAccount" &&
      account.token.tokenType === "trc20" &&
      !isContractAddressRecipient && // send trc20 to a smart contract is allowed
      (await fetchTronAccount(recipient)).length === 0
    ) {
      // send trc20 to a new account is forbidden by us (because it will not activate the account)
      errors.recipient = new TronSendTrc20ToNewAccountForbidden();
    }
  }

  if (mode === "unfreeze") {
    const { bandwidth, energy } = a.tronResources.frozen;
    if (resource === "BANDWIDTH" && t.amount.gt(bandwidth?.amount || new BigNumber(0))) {
      errors.resource = new TronNoFrozenForBandwidth();
    } else if (resource === "ENERGY" && t.amount.gt(energy?.amount || new BigNumber(0))) {
      errors.resource = new TronNoFrozenForEnergy();
    }
  }

  if (mode === "legacyUnfreeze") {
    const now = new Date();
    const expirationDate =
      resource === "ENERGY"
        ? a.tronResources.legacyFrozen.energy?.expiredAt
        : a.tronResources.legacyFrozen.bandwidth?.expiredAt;

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
      (!a.tronResources.unFrozen.bandwidth || a.tronResources.unFrozen.bandwidth.length === 0) &&
      (!a.tronResources.unFrozen.energy || a.tronResources.unFrozen.energy.length === 0)
    ) {
      errors.resource = new TronNoUnfrozenResource();
    } else {
      const unfreezingResources = [
        ...(a.tronResources.unFrozen.bandwidth ?? []),
        ...(a.tronResources.unFrozen.energy ?? []),
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

  if (mode === "unDelegateResource" && resource && a.tronResources) {
    const delegatedResourceAmount = await getDelegatedResource(a, t, resource);
    if (delegatedResourceAmount.lt(t.amount)) {
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
          currencyName: a.currency.name,
        });
      } else if (!isValidVoteCounts) {
        errors.vote = new TronInvalidVoteCount();
      } else {
        const totalVoteCount = sumBy(votes, "voteCount");
        const tronPower = (a.tronResources && a.tronResources.tronPower) || 0;

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

    if (a.tronResources && a.tronResources.unwithdrawnReward.eq(0)) {
      errors.reward = new TronNoReward();
    } else if (lastRewardOp && claimableRewardDate.valueOf() > new Date().valueOf()) {
      errors.reward = new TronRewardNotAvailable("Reward is not claimable", {
        until: claimableRewardDate.toISOString(),
      });
    }
  }

  const estimatedFees =
    Object.entries(errors).length > 0
      ? new BigNumber(0)
      : await getEstimatedFees(a, t, isContractAddressRecipient);
  const balance =
    account.type === "Account"
      ? BigNumber.max(0, account.spendableBalance.minus(estimatedFees))
      : account.balance;
  const amount = useAllAmount ? balance : t.amount;
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
    } else if (account.type === "TokenAccount" && estimatedFees.gt(a.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    const energy = (a.tronResources && a.tronResources.energy) || new BigNumber(0);

    // For the moment, we rely on this rule:
    // Add a 'TronNotEnoughEnergy' warning only if the account sastifies theses 3 conditions:
    // - no energy
    // - balance is lower than 1 TRX
    // - contract consumes user energy (ie: user's ratio > 0%)
    if (
      account.type === "TokenAccount" &&
      account.token.tokenType === "trc20" &&
      energy.lt(47619) // temporary value corresponding to usdt trc20 energy
    ) {
      const contractUserEnergyConsumption = await getContractUserEnergyRatioConsumption(
        account.token.contractAddress,
      );

      if (contractUserEnergyConsumption > 0) {
        warnings.amount = new TronNotEnoughEnergy();
      }
    }
  }

  if (!errors.recipient && estimatedFees.gt(0)) {
    const fees = formatCurrencyUnit(getAccountCurrency(a).units[0], estimatedFees, {
      showCode: true,
      disableRounding: true,
    });
    warnings.fee = new TronUnexpectedFees("Estimated fees", {
      fees,
    });
  }

  return Promise.resolve({
    errors,
    warnings,
    amount: amountSpent,
    estimatedFees,
    totalSpent,
    family,
  });
};

export default getTransactionStatus;
