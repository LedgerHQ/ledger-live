import {
  getEditTransactionPatch,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
  isTransactionConfirmed,
} from "@ledgerhq/coin-evm/editTransaction/index";
import { EditType } from "@ledgerhq/coin-evm/types/editTransaction";
import { Transaction as EvmTransaction, TransactionRaw } from "@ledgerhq/coin-evm/types/index";
import { isOldestPendingOperation } from "@ledgerhq/coin-framework/operation";
import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import { Box, Flex, SelectableList } from "@ledgerhq/native-ui";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { urls } from "~/utils/urls";
import invariant from "invariant";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Dimensions, Linking } from "react-native";
import { TrackScreen } from "~/analytics";
import LText from "~/components/LText";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { EditTransactionParamList } from "./EditTransactionParamList";

const getSpeedUpDescriptionKey = (
  haveFundToSpeedup: boolean,
  isOldestEditableOperation: boolean,
):
  | "editTransaction.speedUp.description"
  | "editTransaction.error.notEnoughFundsToSpeedup"
  | "editTransaction.error.notlowestNonceToSpeedup" => {
  if (!haveFundToSpeedup) {
    return "editTransaction.error.notEnoughFundsToSpeedup";
  }

  if (!isOldestEditableOperation) {
    return "editTransaction.error.notlowestNonceToSpeedup";
  }

  return "editTransaction.speedUp.description";
};

type Props = StackNavigatorProps<
  EditTransactionParamList,
  ScreenName.EvmEditTransactionMethodSelection
>;

function MethodSelectionComponent({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { operation, account, parentAccount } = route.params;

  invariant(
    operation.transactionRaw,
    "operation.transactionRaw not found. Could not edit the transaction",
  );

  const [transactionHasBeenValidated, setTransactionHasBeenValidated] = useState(false);

  const mainAccount = getMainAccount(account, parentAccount);

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw as TransactionRaw,
  ) as EvmTransaction;

  const { transaction, setTransaction } = useBridgeTransaction<EvmTransaction>(() => ({
    account,
    parentAccount,
    transaction: transactionToEdit,
  }));

  invariant(
    transaction,
    "[useBridgeTransaction - MethodSelection] could not found transaction from bridge.",
  );

  const haveFundToCancel = hasMinimumFundsToCancel({
    mainAccount,
    transactionToUpdate: transactionToEdit,
  });

  const haveFundToSpeedup = hasMinimumFundsToSpeedUp({
    account,
    mainAccount,
    transactionToUpdate: transactionToEdit,
  });

  const [selectedMethod, setSelectedMethod] = useState<EditType | null>();

  // if we are at this step (i.e: in this screen) it means the transaction is editable
  const isOldestEditableOperation = isOldestPendingOperation(mainAccount, transactionToEdit.nonce);
  const bridge: AccountBridge<EvmTransaction> = getAccountBridge(account, parentAccount as Account);

  const onSelect = useCallback(
    async (option: EditType) => {
      log("Edit Transaction - Method Selection", "onSelect Cancel/Speed up", option);

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

  /**
   * Poll for transaction confirmation
   * If the transaction has been confirmed, we navigate to the error screen
   * PS: this still runs even if the user has navigated forward in the steps
   * This might be a ReactNative antipatern leading to silent error
   * "Cannot update a component while rendering a different component" error
   * But it works for now and avoid code duplication 🤷‍♂️
   * If you have a better way to do this, please do!
   */
  useEffect(() => {
    const setTransactionHasBeenValidatedCallback = async () => {
      const hasBeenConfirmed = await isTransactionConfirmed({
        currency: mainAccount.currency,
        hash: operation.hash,
      });
      if (hasBeenConfirmed) {
        // stop polling as soon as we have a confirmation
        clearInterval(intervalId);
        setTransactionHasBeenValidated(true);
      }
    };

    setTransactionHasBeenValidatedCallback();
    const intervalId = setInterval(
      () => setTransactionHasBeenValidatedCallback(),
      mainAccount.currency.blockAvgTime
        ? mainAccount.currency.blockAvgTime * 1000
        : getEnv("DEFAULT_TRANSACTION_POLLING_INTERVAL"),
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [mainAccount.currency, operation.hash]);

  if (transactionHasBeenValidated) {
    navigation.navigate(ScreenName.TransactionAlreadyValidatedError, {
      error: new TransactionHasBeenValidatedError(),
    });
  }

  useEffect(() => {
    log("[edit transaction]", "Transaction to edit", transaction);
    log("[edit transaction]", "User balance", mainAccount.balance.toNumber());

    if (!selectedMethod) {
      return;
    }

    navigation.navigate(ScreenName.EditTransactionSummary, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      transactionRaw: operation.transactionRaw as TransactionRaw,
      currentNavigation: ScreenName.EvmEditTransactionMethodSelection,
      nextNavigation: ScreenName.SendSelectDevice,
      editType: selectedMethod,
    });
  }, [
    selectedMethod,
    transaction,
    operation.transactionRaw,
    account.id,
    parentAccount?.id,
    mainAccount.balance,
    navigation,
  ]);

  if (!transaction) {
    return null;
  }

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen category="EditTransaction" name="EditTransaction" />
      <Flex p={6}>
        <SelectableList onChange={onSelect}>
          <SelectableList.Element
            disabled={!haveFundToSpeedup || !isOldestEditableOperation}
            value={"speedup"}
          >
            <Box style={{ width: Dimensions.get("window").width * 0.8 }}>
              <LText bold>
                <Trans i18nKey={"editTransaction.speedUp.title"} />
              </LText>
              <Flex>
                <LText style={{ marginTop: 15, marginBottom: 0 }}>
                  <Trans
                    i18nKey={getSpeedUpDescriptionKey(haveFundToSpeedup, isOldestEditableOperation)}
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
                      // note: ticker is always the main currency ticker
                      ticker: mainAccount.currency.ticker,
                    })
                  : t("editTransaction.error.notEnoughFundsToCancel")}
              </LText>
            </Box>
          </SelectableList.Element>
        </SelectableList>
        <LText
          style={{ marginTop: 8, textDecorationLine: "underline" }}
          onPress={() => Linking.openURL(urls.editEvmTx.learnMore)}
        >
          {t("editTransaction.learnMore")}
        </LText>
      </Flex>
    </Flex>
  );
}

export const MethodSelection = memo<Props>(MethodSelectionComponent);
