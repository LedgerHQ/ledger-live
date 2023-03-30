import React, { memo, useCallback, useEffect } from "react";
import invariant from "invariant";
import { Trans, useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { Flex, SelectableList } from "@ledgerhq/native-ui";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account } from "@ledgerhq/types-live";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { isEditableOperation } from "@ledgerhq/live-common/operation";
import { Linking } from "react-native";

import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import { EditTransactionParamList } from "../EditTransactionNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import LText from "../../../components/LText";
import { urls } from "../../../config/urls";

type Props = StackNavigatorProps<
  EditTransactionParamList,
  ScreenName.EditTransactionMethodSelection
>;

function MethodSelectionComponent({ navigation, route }: Props) {
  const { operation, account, parentAccount } = route.params;

  invariant(
    operation.transactionRaw,
    "operation.transactionRaw not found. Could not edit the transaction",
  );

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw as TransactionRaw,
  ) as Transaction;

  const { transaction, setTransaction, status } =
    useBridgeTransaction<Transaction>(() => {
      return {
        account,
        parentAccount,
        transaction: transactionToEdit,
      };
    });

  invariant(
    transaction,
    "[useBridgeTransaction - MethodSelection] could not found transaction from bridge.",
  );

  const mainAccount = getMainAccount(account, parentAccount);
  const feePerGas = new BigNumber(
    EIP1559ShouldBeUsed(mainAccount.currency)
      ? transactionToEdit.maxFeePerGas!
      : transactionToEdit.gasPrice!,
  );

  const feeValue = new BigNumber(
    transactionToEdit.userGasLimit || transactionToEdit.estimatedGasLimit || 0,
  )
    .times(feePerGas)
    .div(new BigNumber(10).pow(mainAccount.unit.magnitude));

  const haveFundToCancel = mainAccount.balance.gt(feeValue.times(1.3));
  const haveFundToSpeedup = mainAccount.balance.gt(
    feeValue
      .times(1.1)
      .plus(account.type === "Account" ? transactionToEdit.amount : 0),
  );

  let isOldestEditableOperation = true;

  account.pendingOperations.forEach(pendingOperation => {
    if (isEditableOperation(account, pendingOperation)) {
      if (
        operation.transactionSequenceNumber &&
        pendingOperation.transactionSequenceNumber &&
        pendingOperation.transactionSequenceNumber <
          operation.transactionSequenceNumber
      ) {
        isOldestEditableOperation = false;
      }
    }
  });

  const currency = getAccountCurrency(account);

  const bridge = getAccountBridge(account, parentAccount as Account);

  const onSelect = useCallback(
    (option: "cancel" | "speedup") => {
      switch (option) {
        case "cancel":
          {
            const updatedTransaction: Partial<Transaction> = {
              amount: new BigNumber(0),
              data: Buffer.from(""),
              nonce: operation.transactionSequenceNumber,
              allowZeroAmount: true,
              mode: "send",
            };

            if (EIP1559ShouldBeUsed(mainAccount.currency)) {
              if (transactionToEdit.maxPriorityFeePerGas) {
                updatedTransaction.maxPriorityFeePerGas = new BigNumber(
                  transactionToEdit.maxPriorityFeePerGas.times(1.1),
                );
              }

              if (transactionToEdit.maxFeePerGas) {
                updatedTransaction.maxFeePerGas = new BigNumber(
                  transactionToEdit.maxFeePerGas.times(1.3),
                );
              }
            } else if (transactionToEdit.gasPrice) {
              updatedTransaction.gasPrice = new BigNumber(
                transactionToEdit.gasPrice.times(1.3),
              );
            }

            setTransaction(
              bridge.updateTransaction(transaction, updatedTransaction),
            );
          }

          break;

        case "speedup":
          {
            const updatedTransaction: Partial<Transaction> = {
              nonce: operation.transactionSequenceNumber,
              networkInfo: null,
              gasPrice: null,
              maxFeePerGas: null,
              maxPriorityFeePerGas: null,
              mode: "send",
              recipient:
                (account as Account)?.freshAddress ??
                (parentAccount as Account)?.freshAddress,
            };

            setTransaction(
              bridge.updateTransaction(transaction, updatedTransaction),
            );
          }

          break;
        default:
          break;
      }
    },
    [
      account,
      parentAccount,
      transaction,
      transactionToEdit,
      bridge,
      operation.transactionSequenceNumber,
    ],
  );

  useEffect(() => {
    // if cancel
    if (transaction.amount.eq(0)) {
      navigation.navigate(ScreenName.SendSelectDevice, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
        status,
      });
      // if speedup
    } else if (transaction.networkInfo === null) {
      navigation.navigate(ScreenName.SendSummary, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
        transactionRaw: operation.transactionRaw as TransactionRaw,
        operation,
        currentNavigation: ScreenName.EditTransactionMethodSelection,
        nextNavigation: ScreenName.SendSelectDevice,
        setTransaction,
      });
    }
  }, [transaction, onSelect]);

  const { t } = useTranslation();

  if (!transaction) {
    return null;
  }

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen category="EditTransaction" name="EditTransaction" />
      <Flex p={6}>
        <SelectableList onChange={onSelect}>
          <SelectableList.Element disabled={!haveFundToCancel} value={"cancel"}>
            <Trans i18nKey={"editTransaction.cancel.title"} />
            <Flex>
              <LText style={{ marginTop: 15, marginBottom: 0 }}>
                {haveFundToCancel
                  ? t("editTransaction.cancel.description", {
                      ticker: currency.ticker,
                    })
                  : t("editTransaction.error.notEnoughFundsToCancel")}
              </LText>
            </Flex>
          </SelectableList.Element>
          <SelectableList.Element
            disabled={!haveFundToSpeedup || !isOldestEditableOperation}
            value={"speedup"}
          >
            <Trans i18nKey={"editTransaction.speedUp.title"} />
            <Flex>
              <LText style={{ marginTop: 15, marginBottom: 0 }}>
                <Trans
                  i18nKey={
                    !isOldestEditableOperation
                      ? "editTransaction.error.notlowestNonceToSpeedup"
                      : haveFundToSpeedup
                      ? "editTransaction.speedUp.description"
                      : "editTransaction.error.notEnoughFundsToSpeedup"
                  }
                />
              </LText>
            </Flex>
          </SelectableList.Element>
        </SelectableList>
        <LText
          style={{ marginTop: 8, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL(urls.editEthTx.learnMore)}
        >
          {t("editTransaction.learnMore")}
        </LText>
      </Flex>
    </Flex>
  );
}

export const MethodSelection = memo(MethodSelectionComponent);
