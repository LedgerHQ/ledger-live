// @flow
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import Box from "~/renderer/components/Box";
import SendAmountFields from "~/renderer/modals/Send/SendAmountFields";
import { transactionSelector } from "~/renderer/actions/swap";
import type {
  SwapTransactionType,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { DrawerTitle } from "../DrawerTitle";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useGetSwapTrackingProperties } from "../../utils/index";

type Props = {
  setTransaction: $PropertyType<SwapTransactionType, "setTransaction">,
  updateTransaction: $PropertyType<SwapTransactionType, "updateTransaction">,
  mainAccount: $PropertyType<SwapSelectorStateType, "account">,
  currency: $PropertyType<SwapSelectorStateType, "currency">,
  status: $PropertyType<SwapTransactionType, "status">,
  disableSlowStrategy?: boolean,
  provider: ?string,
};
export default function FeesDrawer({
  setTransaction,
  updateTransaction,
  mainAccount,
  status,
  provider,
  disableSlowStrategy = false,
}: Props) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const transaction = useSelector(transactionSelector);
  const mapStrategies = useCallback(
    strategy =>
      strategy.label === "slow" && disableSlowStrategy ? { ...strategy, disabled: true } : strategy,
    [disableSlowStrategy],
  );

  return (
    <Box height="100%">
      <TrackPage
        category="Swap"
        name="Form - Edit Fees"
        provider={provider}
        {...swapDefaultTrack}
      />
      <DrawerTitle i18nKey="swap2.form.details.label.fees" />
      <Box mt={3} flow={4} mr={3}>
        {transaction.networkInfo && (
          <SendAmountFields
            account={mainAccount}
            status={status}
            transaction={transaction}
            onChange={setTransaction}
            updateTransaction={updateTransaction}
            mapStrategies={mapStrategies}
            trackProperties={{
              page: "Swap quotes",
              ...swapDefaultTrack,
            }}
          />
        )}
      </Box>
    </Box>
  );
}
