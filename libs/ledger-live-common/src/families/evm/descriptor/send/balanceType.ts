import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { BalanceTypeConfig, BalanceTypeOption } from "../../../../bridge/descriptor/types";
import { getSpendableConfidentialBalance } from "../../confidential/runtime";
import { CONFIDENTIAL_SOURCE, PUBLIC_SOURCE, getSelectedSource } from "../../confidential/send";

/**
 * Public or confidential (ERC-7984) source for an ERC-20 whose private part the user revealed. Every
 * other EVM account gets no option, so the send flow skips the step and its send is unchanged.
 */
function getOptions({ account }: { account: AccountLike }): readonly BalanceTypeOption[] {
  const balance = getSpendableConfidentialBalance(account);
  if (!balance) return [];
  return [
    {
      id: PUBLIC_SOURCE,
      translationKey: "balanceType.public",
      balance: account.spendableBalance,
      hasPendingBalance: false,
      icon: "check",
    },
    {
      id: CONFIDENTIAL_SOURCE,
      translationKey: "balanceType.confidential",
      balance: new BigNumber(balance.underlyingValue.toString()),
      // A stale value predates the last transfer: the private part may differ until it is revealed again.
      hasPendingBalance: balance.state === "stale",
      icon: "lock",
    },
  ];
}

function getSelectableBalance({
  account,
  optionId,
}: {
  account: AccountLike;
  optionId: string;
}): BigNumber {
  if (optionId === PUBLIC_SOURCE) return account.spendableBalance;
  const balance = optionId === CONFIDENTIAL_SOURCE && getSpendableConfidentialBalance(account);
  return balance ? new BigNumber(balance.underlyingValue.toString()) : new BigNumber(0);
}

export const evmBalanceTypeConfig: BalanceTypeConfig = {
  getOptions,
  getSelectedOptionId: getSelectedSource,
  buildSelectionPatch: optionId => ({ familySpecificData: { balanceType: optionId } }),
  // The two parts belong to one address: there is no other pool to send to.
  getSelfTransferTarget: () => null,
  buildSelfTransferPatch: () => ({}),
  getSelectableBalance,
};
