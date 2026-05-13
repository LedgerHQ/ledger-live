import {
  getEditTransactionPatch,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
  isTransactionConfirmed,
} from "@ledgerhq/coin-bitcoin/editTransaction/index";
import type {
  BitcoinAccount,
  EditType,
  Transaction as BtcTransaction,
  TransactionRaw,
} from "@ledgerhq/coin-bitcoin/types";
import { isOldestBitcoinPendingOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { getEnv } from "@ledgerhq/live-env";
import { Flex } from "@ledgerhq/native-ui";
import { urls } from "~/utils/urls";
import invariant from "invariant";
import React, { memo, useCallback, useEffect, useState } from "react";
import { TrackScreen } from "~/analytics";
import MethodSelectionList from "~/components/EditTransaction/MethodSelectionList";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { BitcoinEditTransactionParamList } from "./EditTransactionParamList";

type Props = StackNavigatorProps<
  BitcoinEditTransactionParamList,
  ScreenName.BitcoinEditTransactionMethodSelection
>;

function MethodSelectionComponent({ navigation, route }: Props) {
  const { operation, account, parentAccount } = route.params;

  const [transactionHasBeenValidated, setTransactionHasBeenValidated] = useState(false);
  const [haveFundToCancel, setHaveFundToCancel] = useState(false);
  const [haveFundToSpeedup, setHaveFundToSpeedup] = useState(false);

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = useAccountBridge<BtcTransaction>(account, parentAccount);

  const [transactionToEdit, setTransactionToEdit] = useState<BtcTransaction | undefined>(
    undefined,
  );
  useEffect(() => {
    let cancelled = false;
    const transactionRaw = {
      family: "bitcoin" as const,
      amount: "0",
      recipient: mainAccount.freshAddress,
      rbf: true,
      replaceTxId: operation.hash,
      utxoStrategy: { strategy: 0, excludeUTXOs: [] },
      feePerByte: null,
      networkInfo: null,
    };
    fromTransactionRaw(transactionRaw as TransactionRaw).then(tx => {
      if (!cancelled)
        setTransactionToEdit({ ...tx, replaceTxId: operation.hash } as BtcTransaction);
    });
    return () => {
      cancelled = true;
    };
  }, [operation.hash, mainAccount.freshAddress]);

  const { transaction, setTransaction } = useBridgeTransaction<BtcTransaction>(bridge, () => ({
    account,
    parentAccount,
    transaction: transactionToEdit,
  }));

  // Sync bridge transaction once transactionToEdit resolves from the async fromTransactionRaw call
  useEffect(() => {
    if (transactionToEdit) setTransaction(transactionToEdit);
  }, [transactionToEdit, setTransaction]);

  useEffect(() => {
    if (!transactionToEdit) return;
    let cancelled = false;
    const run = async () => {
      const [cancel, speedup] = await Promise.all([
        hasMinimumFundsToCancel({ mainAccount, transactionToUpdate: transactionToEdit }),
        hasMinimumFundsToSpeedUp({ mainAccount, transactionToUpdate: transactionToEdit }),
      ]);
      if (!cancelled) {
        setHaveFundToCancel(cancel);
        setHaveFundToSpeedup(speedup);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [mainAccount, transactionToEdit]);

  const [selectedMethod, setSelectedMethod] = useState<EditType | null>(null);

  const isOldestEditableOperation = isOldestBitcoinPendingOperation(mainAccount, operation.date);


  const onSelect = useCallback(
    async (option: EditType) => {
      if (!transactionToEdit || !transaction) return;
      const patch = await getEditTransactionPatch({
        account: mainAccount,
        transaction: transactionToEdit,
        editType: option,
      });
      setTransaction(bridge.updateTransaction(transaction, patch));
      setSelectedMethod(option);
    },
    [mainAccount, transaction, transactionToEdit, bridge, setTransaction],
  );

  useEffect(() => {
    const setTransactionHasBeenValidatedCallback = async () => {
      const walletAccount = (mainAccount as BitcoinAccount).bitcoinResources?.walletAccount;
      if (!walletAccount) return;
      const hasBeenConfirmed = await isTransactionConfirmed(walletAccount, operation.hash);
      if (hasBeenConfirmed) {
        clearInterval(intervalId);
        setTransactionHasBeenValidated(true);
      }
    };

    setTransactionHasBeenValidatedCallback();
    const intervalId = setInterval(
      () => setTransactionHasBeenValidatedCallback(),
      mainAccount.currency.blockAvgTime
        ? mainAccount.currency.blockAvgTime * 100
        : getEnv("DEFAULT_TRANSACTION_POLLING_INTERVAL"),
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [mainAccount, operation.hash]);

  if (transactionHasBeenValidated) {
    navigation.navigate(ScreenName.TransactionAlreadyValidatedError, {
      error: new TransactionHasBeenValidatedError(),
    });
  }

  useEffect(() => {
    if (!selectedMethod || !transaction) {
      return;
    }
    const transactionRaw = {
      family: "bitcoin" as const,
      amount: "0",
      recipient: mainAccount.freshAddress,
      rbf: true,
      replaceTxId: operation.hash,
      utxoStrategy: { strategy: 0, excludeUTXOs: [] },
      feePerByte: null,
      networkInfo: null,
    };
    navigation.navigate(ScreenName.EditTransactionSummary, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      transactionRaw: transactionRaw as TransactionRaw,
      currentNavigation: ScreenName.EditTransactionSummary,
      nextNavigation: ScreenName.SendSelectDevice,
      editType: selectedMethod,
    });
  }, [
    selectedMethod,
    transaction,
    operation,
    account.id,
    parentAccount?.id,
    mainAccount,
    navigation,
  ]);

  if (!transaction || !transactionToEdit) {
    return null;
  }

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen category="EditTransaction" name="EditTransaction" />
      <Flex p={6}>
        <MethodSelectionList<EditType>
          haveFundToCancel={haveFundToCancel}
          haveFundToSpeedup={haveFundToSpeedup}
          isOldestEditableOperation={isOldestEditableOperation}
          ticker={mainAccount.currency.ticker}
          learnMoreUrl={urls.editBitcoinTx.learnMore}
          onSelect={onSelect}
        />
      </Flex>
    </Flex>
  );
}

export const MethodSelection = memo<Props>(MethodSelectionComponent);
