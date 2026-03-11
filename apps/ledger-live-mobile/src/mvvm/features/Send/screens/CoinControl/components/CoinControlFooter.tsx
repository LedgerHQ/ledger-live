import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Box, Button, Divider } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { NetworkFeesRow } from "../../../components/NetworkFeesRow";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { NetworkFeesViewModel } from "../../../types";
import { ChangeToReturn } from "./ChangeToReturn";

type AmountFooterProps = Readonly<{
  changeToReturnFormatted: string;
  changeToReturnLabel: string;
  enterAmountPlaceholder: string;
  networkFees: NetworkFeesViewModel;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds: () => void;
}>;

export function CoinControlFooter({
  changeToReturnFormatted,
  changeToReturnLabel,
  enterAmountPlaceholder,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
  networkFees,
}: AmountFooterProps) {
  const { state } = useSendFlowData();
  const { account } = state.account;
  const { transaction } = state.transaction;

  if (!account || !transaction) {
    return null;
  }

  return (
    <Box lx={{ paddingVertical: "s8" }}>
      <Divider />
      <ChangeToReturn
        value={changeToReturnFormatted}
        changeToReturnLabel={changeToReturnLabel}
        enterAmountPlaceholder={enterAmountPlaceholder}
      />
      <NetworkFeesRow viewModel={networkFees} />
      <Button
        appearance="base"
        size="lg"
        onPress={reviewShowIcon ? onReview : onGetFunds}
        disabled={reviewDisabled}
        loading={reviewLoading}
        icon={reviewShowIcon ? LedgerLogo : undefined}
      >
        {reviewLoading ? "" : reviewLabel}
      </Button>
    </Box>
  );
}
