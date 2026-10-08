import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type {
  BalanceTypeConfig,
  BalanceTypeOption,
  BalanceTypeSelfTransferTarget,
} from "../../../../bridge/descriptor/types";
import {
  getConfidentialSendRuntime,
  getSpendableConfidentialBalance,
  hasConfidentialPart,
} from "../../confidential/runtime";
import { CONFIDENTIAL_SOURCE, PUBLIC_SOURCE, getSelectedSource } from "../../confidential/send";

/**
 * Public or confidential (ERC-7984) source for an ERC-20 with a confidential wrapper: the private
 * source once the user revealed it. Every other EVM account gets no option, so the send flow skips
 * the step and its send is unchanged.
 */
function getOptions({ account }: { account: AccountLike }): readonly BalanceTypeOption[] {
  if (!hasConfidentialPart(account)) return [];
  const publicOption: BalanceTypeOption = {
    id: PUBLIC_SOURCE,
    translationKey: "balanceType.public",
    balance: account.spendableBalance,
    hasPendingBalance: false,
    icon: "check",
  };
  // An unrevealed private part cannot be spent, but the public part can still be shielded into it.
  const balance = getSpendableConfidentialBalance(account);
  if (!balance) return [publicOption];
  return [
    publicOption,
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

/**
 * Both parts share the account's address, which stands for the other part: from the private part
 * sending there is an unshield, from the public part a shield. The flow marks the shortcut with
 * `selfTransfer`.
 */
function getSelfTransferTarget({
  account,
  transaction,
}: {
  account: AccountLike;
  transaction: unknown;
}): BalanceTypeSelfTransferTarget | null {
  const owner = getConfidentialSendRuntime()?.getOwner(account.id);
  if (!owner) return null;
  const source = getSelectedSource(transaction);
  if (source === CONFIDENTIAL_SOURCE && getSpendableConfidentialBalance(account)) {
    return {
      address: owner,
      translationKey: "recipient.selfTransfer.toPublic",
      isDestinationPublic: true,
    };
  }
  if (source === PUBLIC_SOURCE && hasConfidentialPart(account)) {
    return {
      address: owner,
      translationKey: "recipient.selfTransfer.toPrivate",
      isDestinationPublic: false,
    };
  }
  return null;
}

export const evmBalanceTypeConfig: BalanceTypeConfig = {
  getOptions,
  getSelectedOptionId: getSelectedSource,
  buildSelectionPatch: optionId => ({ familySpecificData: { balanceType: optionId } }),
  getSelfTransferTarget,
  buildSelfTransferPatch: ({ isSelfTransfer }) => ({ selfTransfer: isSelfTransfer }),
  getSelectableBalance,
};
