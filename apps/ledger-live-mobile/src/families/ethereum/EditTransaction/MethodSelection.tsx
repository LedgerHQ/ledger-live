import React, { useEffect } from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import BigNumber from "bignumber.js";
import { Flex, SelectableList } from "@ledgerhq/native-ui";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { TransactionRaw } from "@ledgerhq/live-common/generated/types";
import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

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

  const currency = getAccountCurrency(account);

  invariant(transaction, "Could not edit the latest ethereum transaction");

  const bridge = getAccountBridge(account, parentAccount as Account);

  const [latestPendingOperation] = account.pendingOperations.sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const isLatestOperation = operation.id === latestPendingOperation.id;

  const canCancelOperation = (
    account: AccountLike,
    currency: TokenCurrency | CryptoCurrency,
  ): boolean => {
    if (EIP1559ShouldBeUsed(currency)) {
      if (
        transactionToEdit.maxPriorityFeePerGas &&
        transactionToEdit.maxFeePerGas
      ) {
        return new BigNumber(
          transactionToEdit.maxPriorityFeePerGas.toNumber() * 1.1,
        )
          .plus(new BigNumber(transactionToEdit.maxFeePerGas.toNumber() * 1.3))
          .isLessThan(account.balance);
      }

      return false;
    } else {
      if (transactionToEdit.gasPrice) {
        return new BigNumber(
          transactionToEdit.gasPrice.toNumber() * 1.3,
        ).isLessThan(account.balance);
      }

      return false;
    }
  };

  const canSpeedUpOperation = (
    account: AccountLike,
    currency: TokenCurrency | CryptoCurrency,
  ): boolean => {
    if (!isLatestOperation) {
      return false;
    }

    if (EIP1559ShouldBeUsed(currency)) {
      if (
        transactionToEdit.maxPriorityFeePerGas &&
        transactionToEdit.maxFeePerGas
      ) {
        return transactionToEdit.amount
          .plus(
            new BigNumber(
              transactionToEdit.maxPriorityFeePerGas.toNumber() * 1.1,
            ),
          )
          .plus(new BigNumber(transactionToEdit.maxFeePerGas.toNumber() * 1.3))
          .isLessThan(account.balance);
      }

      return false;
    } else {
      if (transactionToEdit.gasPrice) {
        return transactionToEdit.amount
          .plus(new BigNumber(transactionToEdit.gasPrice.toNumber() * 1.3))
          .isLessThan(account.balance);
      }

      return false;
    }
  };

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

  const canCancel = canCancelOperation(account, currency);
  const canSpeedUp = canSpeedUpOperation(account, currency);

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen
        category="EthereumEditTransaction"
        name="EthereumEditTransaction"
      />
      <Flex p={6}>
        <SelectableList onChange={onSelect}>
          <SelectableList.Element disabled={!canCancel} value={"cancel"}>
            <Trans i18nKey={"editTransaction.cancel.title"} />
            <Flex>
              <LText style={{ marginTop: 15, marginBottom: 0 }}>
                <Trans
                  i18nKey={
                    canCancel
                      ? "editTransaction.cancel.description"
                      : "editTransaction.error.notEnoughFundsToCancel"
                  }
                />
              </LText>
            </Flex>
          </SelectableList.Element>
          <SelectableList.Element disabled={!canSpeedUp} value={"speedup"}>
            <Trans i18nKey={"editTransaction.speedup.title"} />
            <Flex>
              <LText style={{ marginTop: 15, marginBottom: 0 }}>
                <Trans
                  i18nKey={
                    canSpeedUp
                      ? "editTransaction.speedup.description"
                      : isLatestOperation
                      ? "editTransaction.error.notlowestNonceToSpeedup"
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
