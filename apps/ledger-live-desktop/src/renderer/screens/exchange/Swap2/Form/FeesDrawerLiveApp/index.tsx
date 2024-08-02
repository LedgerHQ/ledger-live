import React, { useCallback, useState } from "react";
import Box from "~/renderer/components/Box";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import {
  SwapSelectorStateType,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { Account, FeeStrategy } from "@ledgerhq/types-live";
import { t } from "i18next";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Button, Divider } from "@ledgerhq/react-ui";

type Props = {
  setTransaction: SwapTransactionType["setTransaction"];
  mainAccount: SwapSelectorStateType["account"];
  parentAccount: SwapSelectorStateType["parentAccount"];
  status: SwapTransactionType["status"];
  disableSlowStrategy?: boolean;
  provider: string | undefined | null;
  transaction: Transaction;
  onRequestClose: (save: boolean) => void;
};

export default function FeesDrawerLiveApp({
  setTransaction,
  mainAccount,
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

  const handleSetTransaction = useCallback(
    (transaction: Transaction) => {
      setTransactionState(transaction);
      setTransaction(transaction);
    },
    [setTransaction],
  );

  const handleUpdateTransaction = useCallback(
    (updater: (arg0: Transaction) => Transaction) => {
      setTransactionState(prevTransaction => {
        const updatedTransaction = updater(prevTransaction);
        setTransaction(updatedTransaction);
        return updatedTransaction;
      });
    },
    [setTransaction],
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
            status={status}
            transaction={transaction}
            onChange={handleSetTransaction}
            updateTransaction={handleUpdateTransaction}
            mapStrategies={mapStrategies}
            disableSlowStrategy={disableSlowStrategy}
            trackProperties={{
              page: "Swap quotes",
              ...swapDefaultTrack,
            }}
          />
        )}
      </Box>
      <Divider />
      <Box mt={3} mx={3} alignSelf="flex-end">
        <Button variant={"main"} outline borderRadius={48} onClick={() => handleRequestClose(true)}>
          {t("common.continue")}
        </Button>
      </Box>
    </Box>
  );
}
