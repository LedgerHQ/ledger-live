import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import Box from "~/renderer/components/Box";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import { transactionSelector } from "~/renderer/actions/swap";
import {
  SwapTransactionType,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { DrawerTitle } from "../DrawerTitle";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { Account, AccountLike, FeeStrategy } from "@ledgerhq/types-live";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SideDrawer } from "~/renderer/components/SideDrawer";

type Props = {
  setTransaction: SwapTransactionType["setTransaction"];
  updateTransaction: SwapTransactionType["updateTransaction"];
  mainAccount: SwapSelectorStateType["account"];
  parentAccount: SwapSelectorStateType["parentAccount"];
  status: SwapTransactionType["status"];
  disableSlowStrategy?: boolean;
  provider: string | undefined | null;
  transaction: any;
  onRequestClose: any;
  isOpen: boolean;
};

function getCurrency(mainAccount: Account, parentAccount?: Account): CryptoCurrency {
  if (parentAccount) {
    return parentAccount.currency;
  }
  return mainAccount.currency;
}

export default function FeesDrawerLiveApp({
  setTransaction,
  updateTransaction,
  mainAccount,
  parentAccount,
  status,
  provider,
  transaction,
  isOpen,
  onRequestClose,
  disableSlowStrategy = false,
}: Props) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const transactionII = useSelector(transactionSelector);
  if (!mainAccount) return;

  console.log(
    "%capps/ledger-live-desktop/src/renderer/screens/exchange/Swap2/Form/FeesDrawerLiveApp/index.tsx:41 transaction",
    "color: #007acc;",
    transaction,
  );
  // console.log(
  //   "%capps/ledger-live-desktop/src/renderer/screens/exchange/Swap2/Form/FeesDrawerLiveApp/index.tsx:41 transactionII",
  //   "color: #007acc;",
  //   transactionII,
  // );

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

  const [gasOptions, error, loading] = useGasOptions({
    currency,
    transaction: transaction as any,
    interval: currency.blockAvgTime ? currency.blockAvgTime * 1000 : undefined,
  });

  transaction.gasOption = gasOptions;
  transaction.family = currency.family;

  return (
    <SideDrawer
      title={"swap2.form.details.label.fees"}
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      direction="left"
    >
      <Box height="100%">
        <TrackPage
          category="Swap"
          name="Form - Edit Fees"
          provider={provider}
          {...swapDefaultTrack}
        />
        {/* <DrawerTitle i18nKey= /> */}
        <Box mt={3} flow={4} mx={3}>
          {transaction && mainAccount && (
            <SendAmountFields
              account={mainAccount as Account}
              parentAccount={parentAccount}
              status={status}
              transaction={transaction}
              onChange={setTransaction}
              updateTransaction={updateTransaction}
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
