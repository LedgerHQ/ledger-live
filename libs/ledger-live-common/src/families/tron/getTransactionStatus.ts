import { getAccountCurrency, getFeesUnit } from "@ledgerhq/coin-framework/account";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import get from "lodash/get";
import sumBy from "lodash/sumBy";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction, TronAccount } from "./types";
import { findSubAccountById } from "../../account";
import {
  TronInvalidFreezeAmount,
  TronInvalidUnDelegateResourceAmount,
  TronInvalidVoteCount,
  TronLegacyUnfreezeNotExpired,
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronNoReward,
  TronNoUnfrozenResource,
  TronNotEnoughEnergy,
  TronNotEnoughTronPower,
  TronRewardNotAvailable,
  TronSendTrc20ToNewAccountForbidden,
  TronUnexpectedFees,
  TronUnfreezeNotExpired,
  TronVoteRequired,
} from "./errors";
import {
  fetchTronAccount,
  fetchTronContract,
  getContractUserEnergyRatioConsumption,
  getDelegatedResource,
  getTronSuperRepresentatives,
  validateAddress,
} from "./api";
import { ONE_TRX } from "./constants";
import { formatCurrencyUnit } from "../../currencies";
import { getEstimatedFees } from "./logic";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account: TronAccount,
  transaction,
) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const { family, mode, recipient, resource, votes, useAllAmount = false } = transaction;
  const tokenAccount = transaction?.subAccountId
    ? findSubAccountById(account, transaction.subAccountId)
    : undefined;
  const acc = tokenAccount || account;
  const isContractAddressRecipient = (await fetchTronContract(recipient)) !== undefined;

  if (mode === "send" && !recipient) {
    errors.recipient = new RecipientRequired();
  }

  if (["send", "unDelegateResource", "legacyUnfreeze"].includes(mode)) {
    if (recipient === account.freshAddress) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else if (recipient && !(await validateAddress(recipient))) {
      errors.recipient = new InvalidAddress(undefined, {
        currencyName: account.currency.name,
      });
    } else if (
      recipient &&
      mode === "send" &&
      acc.type === "TokenAccount" &&
      acc.token.tokenType === "trc20" &&
      !isContractAddressRecipient && // send trc20 to a smart contract is allowed
      (await fetchTronAccount(recipient)).length === 0
    ) {
      // send trc20 to a new account is forbidden by us (because it will not activate the account)
      errors.recipient = new TronSendTrc20ToNewAccountForbidden();
    }
  }

  if (mode === "unfreeze") {
    const { bandwidth, energy } = account.tronResources.frozen;
    if (resource === "BANDWIDTH" && transaction.amount.gt(bandwidth?.amount || new BigNumber(0))) {
      errors.resource = new TronNoFrozenForBandwidth();
    } else if (resource === "ENERGY" && transaction.amount.gt(energy?.amount || new BigNumber(0))) {
      errors.resource = new TronNoFrozenForEnergy();
    }
  }

  if (mode === "legacyUnfreeze") {
    const lowerCaseResource = resource ? resource.toLowerCase() : "bandwidth";
    const now = new Date();
    const expiredDatePath = `tronResources.legacyFrozen.${lowerCaseResource}.expiredAt`;
    const expirationDate = get(account, expiredDatePath, undefined) as Date | null | undefined;
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
      (!account.tronResources.unFrozen.bandwidth ||
        account.tronResources.unFrozen.bandwidth.length === 0) &&
      (!account.tronResources.unFrozen.energy || account.tronResources.unFrozen.energy.length === 0)
    ) {
      errors.resource = new TronNoUnfrozenResource();
    } else {
      const unfreezingResources = [
        ...(account.tronResources.unFrozen.bandwidth ?? []),
        ...(account.tronResources.unFrozen.energy ?? []),
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

  if (mode === "unDelegateResource" && resource && account.tronResources) {
    const delegatedResourceAmount = await getDelegatedResource(account, transaction, resource);
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
          currencyName: account.currency.name,
        });
      } else if (!isValidVoteCounts) {
        errors.vote = new TronInvalidVoteCount();
      } else {
        const totalVoteCount = sumBy(votes, "voteCount");
        const tronPower = (account.tronResources && account.tronResources.tronPower) || 0;

        if (totalVoteCount > tronPower) {
          errors.vote = new TronNotEnoughTronPower();
        }
      }
    }
  }

  if (mode === "claimReward") {
    const lastRewardOp = acc.operations.find(o => o.type === "REWARD");
    const claimableRewardDate = lastRewardOp
      ? new Date(lastRewardOp.date.getTime() + 24 * 60 * 60 * 1000) // date + 24 hours
      : new Date();

    if (account.tronResources && account.tronResources.unwithdrawnReward.eq(0)) {
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
      : await getEstimatedFees(account, transaction, isContractAddressRecipient);
  const balance =
    acc.type === "Account"
      ? BigNumber.max(0, acc.spendableBalance.minus(estimatedFees))
      : acc.balance;
  const amount = useAllAmount ? balance : transaction.amount;
  const amountSpent = ["send", "freeze", "undelegateResource"].includes(mode)
    ? amount
    : new BigNumber(0);

  if (mode === "freeze" && amount.lt(ONE_TRX)) {
    errors.amount = new TronInvalidFreezeAmount();
  }

  // fees are applied in the parent only (TRX)
  const totalSpent = acc.type === "Account" ? amountSpent.plus(estimatedFees) : amountSpent;

  if (["send", "freeze"].includes(mode)) {
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }
    if (amountSpent.eq(0)) {
      errors.amount = useAllAmount ? new NotEnoughBalance() : new AmountRequired();
    } else if (amount.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    } else if (acc.type === "TokenAccount" && estimatedFees.gt(account.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    const energy = (account.tronResources && account.tronResources.energy) || new BigNumber(0);

    // For the moment, we rely on this rule:
    // Add a 'TronNotEnoughEnergy' warning only if the account sastifies theses 3 conditions:
    // - no energy
    // - balance is lower than 1 TRX
    // - contract consumes user energy (ie: user's ratio > 0%)
    if (
      acc.type === "TokenAccount" &&
      acc.token.tokenType === "trc20" &&
      energy.lt(47619) // temporary value corresponding to usdt trc20 energy
    ) {
      const contractUserEnergyConsumption = await getContractUserEnergyRatioConsumption(
        acc.token.contractAddress,
      );

      if (contractUserEnergyConsumption > 0) {
        warnings.amount = new TronNotEnoughEnergy();
      }
    }
  }

  if (!errors.recipient && estimatedFees.gt(0)) {
    const fees = formatCurrencyUnit(getAccountCurrency(account).units[0], estimatedFees, {
      showCode: true,
      disableRounding: true,
    });
    warnings.fee = new TronUnexpectedFees("Estimated fees", {
      fees,
    });
  }

  //
  // Not enough gas check (on currency account)
  // PTX swap uses this to support deeplink to buy additional currency
  //
  if (balance.lt(estimatedFees) || balance.isZero()) {
    const query = new URLSearchParams({
      ...(account?.id ? { account: account.id } : {}),
    });
    errors.gasPrice = new NotEnoughGas(undefined, {
      fees: formatCurrencyUnit(getFeesUnit(account.currency), estimatedFees),
      ticker: account.currency.ticker,
      cryptoName: account.currency.name,
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
  });
};
