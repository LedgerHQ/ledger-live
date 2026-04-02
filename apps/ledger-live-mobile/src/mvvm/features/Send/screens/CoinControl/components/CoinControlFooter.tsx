import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Box, Button, Divider } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { NetworkFeesRow } from "../../../components/NetworkFeesRow";
import { NetworkFeesViewModel } from "../../../types";
import type { CoinControlChangeToReturnViewModel } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlScreenViewModelCore";
import { ChangeToReturn } from "./ChangeToReturn";

type AmountFooterProps = Readonly<{
  changeToReturn: CoinControlChangeToReturnViewModel;
  networkFees: NetworkFeesViewModel;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  onReview: () => void;
  onGetFunds: () => void;
}>;

export function CoinControlFooter({
  changeToReturn,
  reviewLabel,
  reviewShowIcon,
  reviewDisabled,
  reviewLoading,
  onReview,
  onGetFunds,
  networkFees,
}: AmountFooterProps) {
  return (
    <Box lx={{ paddingVertical: "s8" }}>
      <Divider />
      <ChangeToReturn changeToReturn={changeToReturn} />
      <NetworkFeesRow viewModel={networkFees} />
      <Button
        appearance="base"
        size="lg"
        lx={{ marginTop: "s8" }}
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
