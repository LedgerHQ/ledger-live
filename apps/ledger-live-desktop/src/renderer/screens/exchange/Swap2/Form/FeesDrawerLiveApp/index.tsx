import React, { useCallback, useState, useEffect } from "react";
import Box from "~/renderer/components/Box";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import {
  SwapTransactionType,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/types";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { Account, FeeStrategy } from "@ledgerhq/types-live";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { t } from "i18next";
import { Transaction } from "@ledgerhq/live-common/generated/types";

type Props = {
  setTransaction: SwapTransactionType["setTransaction"];
  mainAccount: SwapSelectorStateType["account"];
  parentAccount: SwapSelectorStateType["parentAccount"];
  status: SwapTransactionType["status"];
  disableSlowStrategy?: boolean;
  provider: string | undefined | null;
  transaction: any;
  onRequestClose: any;
};

function getCurrency(mainAccount: Account, parentAccount?: Account): CryptoCurrency {
  if (parentAccount) {
    return parentAccount.currency;
  }
  return mainAccount.currency;
}

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
  if (!mainAccount) return;

  const [isOpen, setIsOpen] = useState(true);
  const [transaction, setTransactionState] = useState(initialTransaction);

  useEffect(() => {
    setTransactionState(initialTransaction);
  }, [initialTransaction]);

  const handleSetTransaction = useCallback(
    (transaction: Transaction) => {
      setTransactionState(transaction);
      setTransaction(transaction);
    },
    [setTransaction],
  );

  const handleUpdateTransaction = useCallback(
    (updater: (arg0: any) => any) => {
      setTransactionState((prevTransaction: any) => {
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

  const currency = getCurrency(mainAccount as Account, parentAccount);

  // const [gasOptions, error, loading] = useGasOptions({
  //   currency,
  //   transaction: transaction as any,
  //   interval: currency.blockAvgTime ? currency.blockAvgTime * 1000 : undefined,
  // });

  const handleRequestClose = useCallback(() => {
    setIsOpen(false);
    onRequestClose();
  }, [onRequestClose]);

  // transaction.gasOption = gasOptions;
  // transaction.family = currency.family;

  if (!isOpen) return null;

  return (
    <SideDrawer
      title={t("swap2.form.details.label.fees")}
      isOpen={isOpen}
      preventBackdropClick
      onRequestClose={handleRequestClose}
      direction="left"
    >
      <Box height="100%">
        <TrackPage
          category="Swap"
          name="Form - Edit Fees"
          provider={provider}
          {...swapDefaultTrack}
        />
        <Box mt={3} flow={4} mx={3}>
          {transaction && mainAccount && (
            <SendAmountFields
              account={mainAccount as Account}
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
      </Box>
    </SideDrawer>
  );
}
