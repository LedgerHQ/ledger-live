import React, { useCallback, useState } from "react";
import Box from "~/renderer/components/Box";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { Account, AccountLike, FeeStrategy } from "@ledgerhq/types-live";
import { t } from "i18next";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Button, Divider, Flex } from "@ledgerhq/react-ui";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import LowGasAlertBuyMore from "~/renderer/families/evm/SendAmountFields/LowGasAlertBuyMore";
import TranslatedError from "~/renderer/components/TranslatedError";
import Alert from "~/renderer/components/Alert";

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

  const [isOpen, setIsOpen] = useState(true);
  const [transaction, setTransactionState] = useState(initialTransaction);
  const [transactionStatus, setTransactionStatus] = useState(status);
  const mainAccount = getMainAccount(account, parentAccount);

  const bridge = getAccountBridge(mainAccount, parentAccount);
  const { amount: amountError, gasPrice: gasPriceError } = transactionStatus.errors;

  const handleSetTransaction = useCallback(
    (transaction: Transaction) => {
      bridge
        .prepareTransaction(mainAccount, transaction)
        .then(preparedTransaction =>
          bridge.getTransactionStatus(mainAccount, preparedTransaction).then(status => {
            setTransactionStatus(status);
            setTransactionState(preparedTransaction);
            setTransaction(preparedTransaction);
          }),
        )
        .catch(error => {
          console.error("Error preparing transaction:", error);
        });
    },
    [setTransaction, bridge, mainAccount],
  );

  const handleUpdateTransaction = useCallback(
    (updater: (arg0: Transaction) => Transaction) => {
      setTransactionState(prevTransaction => {
        let updatedTransaction = updater(prevTransaction);
        bridge
          .prepareTransaction(mainAccount, updatedTransaction)
          .then(preparedTransaction =>
            bridge.getTransactionStatus(mainAccount, preparedTransaction).then(status => {
              setTransactionStatus(status);
              setTransaction(preparedTransaction);
              updatedTransaction = preparedTransaction;
            }),
          )
          .catch(error => {
            console.error("Error updating transaction:", error);
            return prevTransaction;
          });

        return updatedTransaction;
      });
    },
    [setTransaction, bridge, mainAccount],
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
    (save: boolean) => {
      setIsOpen(false);
      onRequestClose(save);
    },
    [onRequestClose, setIsOpen],
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
        {transaction && mainAccount && (
          <SendAmountFields
            account={parentAccount || (mainAccount as Account)}
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
