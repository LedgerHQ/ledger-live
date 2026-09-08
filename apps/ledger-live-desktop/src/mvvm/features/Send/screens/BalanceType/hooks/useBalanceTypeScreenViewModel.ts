import { useCallback } from "react";
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
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction as ZcashTransaction } from "@ledgerhq/coin-zcash/types";
import BigNumber from "bignumber.js";

export type BalanceSender = "public" | "private";

export type BalanceTypeOption = {
  sender: BalanceSender;
  balance: BigNumber;
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

  const { account, parentAccount } = state.account;
  const { transaction } = state.transaction;

  // account is guaranteed non-null by the early return below; the hook must be
  // called unconditionally per the Rules of Hooks.
  const bridge = useAccountBridge<ZcashTransaction>(account!);

  const onSelect = useCallback(
    (sender: BalanceSender) => {
      if (!transaction || !account) return;
      const tx = transaction as unknown as ZcashTransaction;
      transactionActions.setTransaction(
        bridge.updateTransaction(tx, { sender }) as unknown as Transaction,
      );
      navigation.goToStep(SEND_FLOW_STEP.RECIPIENT);
    },
    [transaction, account, transactionActions, bridge, navigation],
  );

  if (!account || !transaction) {
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
      hasMaturingNotes: false,
    },
    shieldedOption: {
      sender: "private",
      balance: shieldedBalance,
      hasMaturingNotes: hasMaturingIronwoodNotes(zcashAccount),
    },
    transactionActions,
    onSelect,
  };
}
