import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Button, Divider, Flex } from "@ledgerhq/react-ui";
import { Account, AccountLike, FeeStrategy } from "@ledgerhq/types-live";
import { t } from "i18next";
import isEqual from "lodash/isEqual";
import React, { useCallback, useRef, useState } from "react";
import { useTrack } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import LowGasAlertBuyMore from "~/renderer/components/LowGasAlertBuyMore";
import Text from "~/renderer/components/Text";
import TranslatedError from "~/renderer/components/TranslatedError";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import { useGetSwapTrackingProperties } from "../../utils/index";

type Props = {
  setTransaction: SwapTransactionType["setTransaction"];
  account: AccountLike;
  parentAccount: Account;
  status: SwapTransactionType["status"];
  disableSlowStrategy?: boolean;
  provider: string | undefined | null;
  transaction: Transaction;
  onRequestClose: (save: boolean) => void;
};

export default function FeesDrawerLiveApp({
  setTransaction,
  account,
  parentAccount,
  status,
  provider,
  transaction: initialTransaction,
  onRequestClose,
  disableSlowStrategy = false,
}: Props) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const track = useTrack();

  const [isOpen, setIsOpen] = useState(true);
  const [transaction, setTransactionState] = useState(initialTransaction);
  const [transactionStatus, setTransactionStatus] = useState(status);
  const mainAccount = getMainAccount(account, parentAccount);
  const isPreparingRef = useRef(false);

  const bridge = getAccountBridge(mainAccount, parentAccount);
  const { amount: amountError, gasPrice: gasPriceError } = transactionStatus.errors;

  const handleSetTransaction = useCallback(
    (newTransaction: Transaction) => {
      // Prevent concurrent preparations
      if (isPreparingRef.current) {
        return;
      }

      // Check if transaction actually changed to prevent unnecessary re-preparations
      if (isEqual(transaction, newTransaction)) {
        return;
      }

      isPreparingRef.current = true;
      bridge
        .prepareTransaction(mainAccount, newTransaction)
        .then(preparedTransaction => {
          return bridge.getTransactionStatus(mainAccount, preparedTransaction).then(status => {
            setTransactionStatus(status);
            setTransactionState(preparedTransaction);
            isPreparingRef.current = false;
          });
        })
        .catch(error => {
          console.error("Error preparing transaction:", error);
          isPreparingRef.current = false;
        });
    },
    [bridge, mainAccount, transaction],
  );

  const handleUpdateTransaction = useCallback(
    (updater: (arg0: Transaction) => Transaction) => {
      const updatedTransaction = updater(transaction);

      if (transaction.feesStrategy !== updatedTransaction.feesStrategy) {
        track("button_clicked", {
          ...swapDefaultTrack,
          button: updatedTransaction.feesStrategy,
          page: "quoteSwap",
        });
      }

      // Prevent concurrent preparations
      if (isPreparingRef.current) {
        return;
      }

      // Check if transaction actually changed to prevent unnecessary re-preparations
      if (isEqual(transaction, updatedTransaction)) {
        return;
      }

      isPreparingRef.current = true;
      bridge
        .prepareTransaction(mainAccount, updatedTransaction)
        .then(preparedTransaction => {
          return bridge.getTransactionStatus(mainAccount, preparedTransaction).then(status => {
            setTransactionStatus(status);
            setTransactionState(preparedTransaction);
            isPreparingRef.current = false;
          });
        })
        .catch(error => {
          console.error("Error updating transaction:", error);
          isPreparingRef.current = false;
        });
    },
    [bridge, mainAccount, swapDefaultTrack, track, transaction],
  );

  const mapStrategies = useCallback(
    (strategy: FeeStrategy) =>
      strategy.label === "slow" && disableSlowStrategy
        ? {
            ...strategy,
            disabled: true,
          }
        : strategy,
    [disableSlowStrategy],
  );

  const handleRequestClose = useCallback(
    async (save: boolean) => {
      setIsOpen(false);

      // Only notify parent with final transaction when saving
      if (save) {
        await setTransaction(transaction);
      }

      onRequestClose(save);
    },
    [onRequestClose, setIsOpen, transaction, setTransaction],
  );

  if (!mainAccount) return;
  if (!isOpen) return null;

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Divider />
      <TrackPage
        category="Swap"
        name="Form - Edit Fees"
        provider={provider}
        {...swapDefaultTrack}
      />
      <Box mt={3} flow={4} mx={3} flex="1">
        <Text color={"palette.neutral.c70"} fontSize={14} fontWeight="500">
          {t("swap2.form.details.label.feesDescription")}
        </Text>
        {transaction && mainAccount && (
          <SendAmountFields
            account={parentAccount || mainAccount}
            parentAccount={parentAccount}
            status={transactionStatus}
            transaction={transaction}
            onChange={handleSetTransaction}
            updateTransaction={handleUpdateTransaction}
            mapStrategies={mapStrategies}
            disableSlowStrategy={disableSlowStrategy}
            disableEditGasLimit={true}
            trackProperties={{
              page: "Swap quotes",
              ...swapDefaultTrack,
            }}
          />
        )}
        <LowGasAlertBuyMore
          account={mainAccount}
          handleRequestClose={() => handleRequestClose(false)}
          gasPriceError={gasPriceError}
          trackingSource={"swap flow"}
        />
        {amountError && !gasPriceError && (
          <Flex>
            <Alert type="warning">
              <TranslatedError error={amountError} />
            </Alert>
          </Flex>
        )}
      </Box>
      <Divider />
      <Box mt={3} mx={3} alignSelf="flex-end">
        <Button
          disabled={Object.keys(transactionStatus.errors).length > 0}
          variant={"main"}
          outline
          borderRadius={48}
          onClick={() => handleRequestClose(true)}
        >
          {t("common.continue")}
        </Button>
      </Box>
    </Box>
  );
}
