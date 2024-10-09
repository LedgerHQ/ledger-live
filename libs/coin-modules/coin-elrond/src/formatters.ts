import invariant from "invariant";
import type { Operation } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { ElrondAccount, ElrondOperation } from "./types";
import BigNumber from "bignumber.js";

function formatAccountSpecifics(account: ElrondAccount): string {
  const { elrondResources } = account;
  invariant(elrondResources, "elrond account expected");
  const unit = getAccountCurrency(account).units[0];
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  };
  let str = " ";

  if (account.spendableBalance) {
    str += formatCurrencyUnit(unit, account.spendableBalance, formatConfig) + " spendable. ";
  } else {
    str += " 0 spendable.";
  }

  if (elrondResources && elrondResources.nonce) {
    str += "\n  nonce : " + elrondResources.nonce;
  }

  if (elrondResources && elrondResources.delegations) {
    let delegated = new BigNumber(0);
    let undelegating = new BigNumber(0);
    let rewards = new BigNumber(0);
    for (const delegation of elrondResources.delegations) {
      delegated = delegated.plus(delegation.userActiveStake);
      undelegating = delegation.userUndelegatedList.reduce(
        (sum, undelegation) => sum.plus(undelegation.amount),
        undelegating,
      );
      rewards = rewards.plus(delegation.claimableRewards);
    }

    str +=
      delegated && delegated.gt(0)
        ? `\n  delegated: ${unit ? formatCurrencyUnit(unit, delegated, formatConfig) : delegated}`
        : undelegating && undelegating.gt(0)
          ? `\n  undelegating: ${
              unit ? formatCurrencyUnit(unit, undelegating, formatConfig) : undelegating
            }`
          : rewards && rewards.gt(0)
            ? `\n  rewards: ${unit ? formatCurrencyUnit(unit, rewards, formatConfig) : rewards}`
            : "";
  }

  return str;
}

function formatOperationSpecifics(op: Operation, unit: Unit | null | undefined): string {
  const { amount } = (op as ElrondOperation).extra;
  return amount?.gt && amount.gt(0)
    ? " amount: " +
        `${
          unit
            ? formatCurrencyUnit(unit, new BigNumber(amount), {
                showCode: true,
                disableRounding: true,
              }).padEnd(16)
            : amount
        }`
    : "";
}

export default {
  formatAccountSpecifics,
  formatOperationSpecifics,
};
