import { useCallback } from "react";
import BigNumber from "bignumber.js";
import {
  SEND_FLOW_STEP,
  type SendFlowTransactionActions,
} from "@ledgerhq/live-common/flows/send/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getTransparentBalance } from "@ledgerhq/coin-zcash/logic/account/balance";
import {
  getSpendableIronwoodBalance,
  hasMaturingIronwoodNotes,
} from "@ledgerhq/coin-zcash/logic/account/spendability";
import { getReservedNullifiers } from "@ledgerhq/coin-zcash/bridge/note-reservation";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { useSelector } from "LLD/hooks/redux";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { discreetModeSelector, localeSelector } from "~/renderer/reducers/settings";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { Transaction as ZcashTransaction, ZcashAccount } from "@ledgerhq/coin-zcash/types";

export type BalanceSender = "public" | "private";

export type BalanceTypeOption = {
  sender: BalanceSender;
  balance: BigNumber;
  formattedBalance: string;
  isZero: boolean;
  hasMaturingNotes: boolean;
};

export type BalanceTypeScreenViewModel =
  | { ready: false }
  | {
      ready: true;
      account: AccountLike;
      parentAccount: Account | null;
      selectedSender: BalanceSender | null;
      transparentOption: BalanceTypeOption;
      shieldedOption: BalanceTypeOption;
      transactionActions: SendFlowTransactionActions;
      onSelect: (sender: BalanceSender) => void;
    };

export function useBalanceTypeScreenViewModel(): BalanceTypeScreenViewModel {
  const { state } = useSendFlowData();
  const { transaction: transactionActions } = useSendFlowActions();
  const { navigation } = useFlowWizard();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const { account, parentAccount } = state.account;
  const { transaction } = state.transaction;

  const bridge = useAccountBridgeOrNull<ZcashTransaction>(account);
  const unit = useMaybeAccountUnit(account ?? undefined);

  const onSelect = useCallback(
    (sender: BalanceSender) => {
      if (!transaction || !account || !bridge) return;
      const tx = transaction as unknown as ZcashTransaction;
      transactionActions.setTransaction(
        bridge.updateTransaction(tx, { sender }) as unknown as Transaction,
      );
      navigation.goToStep(SEND_FLOW_STEP.RECIPIENT);
    },
    [transaction, account, transactionActions, bridge, navigation],
  );

  if (!account || !transaction || !bridge) {
    return { ready: false };
  }

  const zcashAccount = account as ZcashAccount;
  const tx = transaction as unknown as ZcashTransaction;
  const selectedSender: BalanceSender | null = tx.sender ?? null;

  const reserved = getReservedNullifiers(zcashAccount);
  const shieldedBalance = getSpendableIronwoodBalance(zcashAccount, reserved);
  const transparentBalance = getTransparentBalance(zcashAccount.bitcoinResources?.utxos);

  return {
    ready: true,
    account,
    parentAccount,
    selectedSender,
    transparentOption: {
      sender: "public",
      balance: transparentBalance,
      formattedBalance: unit
        ? formatCurrencyUnit(unit, transparentBalance, {
            showCode: true,
            locale,
            discreet,
          })
        : "",
      isZero: transparentBalance.isZero(),
      hasMaturingNotes: false,
    },
    shieldedOption: {
      sender: "private",
      balance: shieldedBalance,
      formattedBalance: unit
        ? formatCurrencyUnit(unit, shieldedBalance, {
            showCode: true,
            locale,
            discreet,
          })
        : "",
      isZero: shieldedBalance.isZero(),
      hasMaturingNotes: hasMaturingIronwoodNotes(zcashAccount),
    },
    transactionActions,
    onSelect,
  };
}
