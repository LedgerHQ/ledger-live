import React, { useEffect } from "react";
import invariant from "invariant";
import { Trans, useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { Flex, SelectableList } from "@ledgerhq/native-ui";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { TransactionRaw } from "@ledgerhq/live-common/generated/types";
import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account } from "@ledgerhq/types-live";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { isEditableOperation } from "@ledgerhq/live-common/operation";

import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import { EditTransactionParamList } from "../../../components/RootNavigator/types/EditTransactionNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import LText from "../../../components/LText";

type Props = StackNavigatorProps<
  EditTransactionParamList,
  ScreenName.EditTransactionMethodSelection
>;

export function MethodSelection({ navigation, route }: Props) {
  const { operation, account, parentAccount } = route.params;

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw! as TransactionRaw,
  ) as Transaction;

  const { transaction, setTransaction, status } =
    useBridgeTransaction<Transaction>(() => {
      return {
        account,
        parentAccount: parentAccount as Account,
        transaction: transactionToEdit,
      };
    });

  const mainAccount = getMainAccount(account, parentAccount as Account);
  const feePerGas = new BigNumber(
    EIP1559ShouldBeUsed(mainAccount.currency)
      ? transactionToEdit.maxFeePerGas!
      : transactionToEdit.gasPrice!,
  );

  const feeValue = new BigNumber(
    transactionToEdit.userGasLimit! || transactionToEdit.estimatedGasLimit,
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

  invariant(transaction, "Could not edit the latest ethereum transaction");

  const bridge = getAccountBridge(account, parentAccount as Account);

  const { t } = useTranslation();
  const onSelect = (option: "cancel" | "speedup") => {
    switch (option) {
      case "cancel":
        transactionToEdit.amount = new BigNumber(0);
        transaction.data = Buffer.from("");

        if (EIP1559ShouldBeUsed(currency)) {
          if (transactionToEdit.maxPriorityFeePerGas) {
            transactionToEdit.maxPriorityFeePerGas = new BigNumber(
              transactionToEdit.maxPriorityFeePerGas.toNumber() * 1.1,
            );
          }

          if (transactionToEdit.maxFeePerGas) {
            transactionToEdit.maxFeePerGas = new BigNumber(
              transactionToEdit.maxFeePerGas.toNumber() * 1.3,
            );
          }
        } else {
          if (transactionToEdit.gasPrice) {
            transactionToEdit.gasPrice = new BigNumber(
              transactionToEdit.gasPrice.toNumber() * 1.3,
            );
          }
        }

        setTransaction(
          bridge.updateTransaction(transaction, transactionToEdit),
        );

        break;

      case "speedup":
        navigation.navigate(ScreenName.SendSummary, {
          accountId: account.id,
          parentId: parentAccount?.id,
          isEdit: true,
          transaction,
          operation,
          currentNavigation: ScreenName.EditTransactionMethodSelection,
          nextNavigation: ScreenName.SendSelectDevice,
        });
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (transaction.amount.eq(0)) {
      navigation.navigate(ScreenName.SendSelectDevice, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
        status,
      });
    }
  }, [transaction, onSelect]);

  if (!transaction) {
    return null;
  }

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen
        category="EthereumEditTransaction"
        name="EthereumEditTransaction"
      />
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
      </Flex>
    </Flex>
  );
}
