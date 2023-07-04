import React, { memo, useCallback, useEffect, useState } from "react";
import invariant from "invariant";
import { Trans, useTranslation } from "react-i18next";
import BigNumber from "bignumber.js";
import { Dimensions, Linking } from "react-native";
import { Box, Flex, SelectableList } from "@ledgerhq/native-ui";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { Transaction, TransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account } from "@ledgerhq/types-live";
import { EIP1559ShouldBeUsed } from "@ledgerhq/live-common/families/ethereum/transaction";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getStuckAccountAndOperation } from "@ledgerhq/coin-framework/operation";
import { apiForCurrency } from "@ledgerhq/live-common/families/ethereum/api/index";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";

import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import { EditTransactionParamList } from "./EditTransactionParamList";
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

  const mainAccount = getMainAccount(account, parentAccount);

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw as TransactionRaw,
  ) as Transaction;

  const { transaction, setTransaction, status } = useBridgeTransaction<Transaction>(() => {
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

  const feePerGas = new BigNumber(
    EIP1559ShouldBeUsed(mainAccount.currency)
      ? transactionToEdit.maxFeePerGas!
      : transactionToEdit.gasPrice!,
  );

  const estimatedFees = new BigNumber(
    transactionToEdit.userGasLimit || transactionToEdit.estimatedGasLimit || 0,
  )
    .times(feePerGas)
    .div(new BigNumber(10).pow(mainAccount.unit.magnitude));

  const haveFundToCancel = mainAccount.balance.gt(
    estimatedFees.times(1 + getEnv("EDIT_TX_EIP1559_MAXFEE_GAP_CANCEL_FACTOR")),
  );

  const haveFundToSpeedup = mainAccount.balance.gt(
    estimatedFees
      .times(1 + getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR"))
      .plus(account.type === "Account" ? transactionToEdit.amount : 0),
  );

  const [selectedMethod, setSelectedMethod] = useState<"cancel" | "speedup" | null>();

  const stuckAccountAndOperation = getStuckAccountAndOperation(account, parentAccount);
  const oldestOperation = stuckAccountAndOperation?.operation;
  const currency = getAccountCurrency(account);
  const bridge = getAccountBridge(account, parentAccount as Account);

  const onSelect = useCallback(
    (option: "cancel" | "speedup") => {
      log("Edit Transaction - Method Selection", "onSelect Cancel/Speed up", option);

      switch (option) {
        case "cancel":
          {
            const mainAccount = getMainAccount(account, parentAccount);
            const updatedTransaction: Partial<Transaction> = {
              amount: new BigNumber(0),
              data: undefined,
              nonce: operation.transactionSequenceNumber,
              allowZeroAmount: true,
              mode: "send",
              recipient: mainAccount.freshAddress,
              useAllAmount: false,
            };

            if (EIP1559ShouldBeUsed(mainAccount.currency)) {
              if (transactionToEdit.maxPriorityFeePerGas) {
                updatedTransaction.maxPriorityFeePerGas = transactionToEdit.maxPriorityFeePerGas
                  ?.times(1 + getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR"))
                  .integerValue();
              }

              if (transactionToEdit.maxFeePerGas) {
                updatedTransaction.maxFeePerGas = transactionToEdit.maxFeePerGas
                  ?.times(1 + getEnv("EDIT_TX_EIP1559_MAXFEE_GAP_CANCEL_FACTOR"))
                  .integerValue();
              }
            } else if (transactionToEdit.gasPrice) {
              updatedTransaction.gasPrice = transactionToEdit.gasPrice
                .times(1 + getEnv("EDIT_TX_NON_EIP1559_GASPRICE_GAP_CANCEL_FACTOR"))
                .integerValue();
            }

            setTransaction(bridge.updateTransaction(transaction, updatedTransaction));

            setSelectedMethod("cancel");
          }

          break;

        case "speedup":
          {
            const updatedTransaction: Partial<Transaction> = {
              amount: transactionToEdit.amount,
              data: transactionToEdit.data,
              recipient: transactionToEdit.recipient,
              mode: transactionToEdit.mode,
              nonce: operation.transactionSequenceNumber,
              // set "fast" as default option for speedup flow
              feesStrategy: "fast",
              networkInfo: null,
              gasPrice: null,
              maxFeePerGas: null,
              maxPriorityFeePerGas: null,
              useAllAmount: false,
            };

            setTransaction(bridge.updateTransaction(transaction, updatedTransaction));

            setSelectedMethod("speedup");
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
      setTransaction,
    ],
  );

  apiForCurrency(mainAccount.currency)
    .getTransactionByHash(operation.hash)
    .then(tx => {
      if (tx?.confirmations) {
        navigation.navigate(ScreenName.TransactionAlreadyValidatedError, {
          error: new TransactionHasBeenValidatedError(
            "The transaction has already been validated. You can't cancel or speedup a validated transaction.",
          ),
        });
      }
    });

  useEffect(() => {
    log("[edit transaction]", "Transaction to edit", transaction);
    log("[edit transaction]", "User balance", mainAccount.balance.toNumber());

    if (selectedMethod === "cancel") {
      navigation.navigate(ScreenName.SendSelectDevice, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
        status,
      });
    } else if (selectedMethod === "speedup") {
      navigation.navigate(ScreenName.EthereumEditTransactionSummary, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
        transactionRaw: operation.transactionRaw as TransactionRaw,
        operation,
        currentNavigation: ScreenName.EditTransactionMethodSelection,
        nextNavigation: ScreenName.SendSelectDevice,
      });
    }
  }, [
    selectedMethod,
    transaction,
    operation,
    status,
    account.id,
    parentAccount?.id,
    mainAccount.balance,
    navigation,
  ]);

  const { t } = useTranslation();

  if (!transaction) {
    return null;
  }

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen category="EditTransaction" name="EditTransaction" />
      <Flex p={6}>
        <SelectableList onChange={onSelect}>
          <SelectableList.Element
            disabled={!haveFundToSpeedup || !oldestOperation}
            value={"speedup"}
          >
            <Box style={{ width: Dimensions.get("window").width * 0.8 }}>
              <LText bold>
                <Trans i18nKey={"editTransaction.speedUp.title"} />
              </LText>
              <Flex>
                <LText style={{ marginTop: 15, marginBottom: 0 }}>
                  <Trans
                    i18nKey={
                      !oldestOperation
                        ? "editTransaction.error.notlowestNonceToSpeedup"
                        : haveFundToSpeedup
                        ? "editTransaction.speedUp.description"
                        : "editTransaction.error.notEnoughFundsToSpeedup"
                    }
                  />
                </LText>
              </Flex>
            </Box>
          </SelectableList.Element>

          <SelectableList.Element disabled={!haveFundToCancel} value={"cancel"}>
            <Box style={{ width: Dimensions.get("window").width * 0.8 }}>
              <LText bold>
                <Trans i18nKey={"editTransaction.cancel.title"} />
              </LText>
              <LText
                style={{
                  marginTop: 15,
                  marginBottom: 0,
                  overflow: "hidden",
                }}
              >
                {haveFundToCancel
                  ? t("editTransaction.cancel.description", {
                      ticker: currency.ticker,
                    })
                  : t("editTransaction.error.notEnoughFundsToCancel")}
              </LText>
            </Box>
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

export const MethodSelection = memo<Props>(MethodSelectionComponent);
