import React from "react";
import { CardLogin, type OpenHostedLogin } from "@features/flow-pay-card-auth";
import { FeatureTour, type FeatureTourProps } from "@features/flow-pay-card-feature-tour";
import {
  PayCardBalance,
  type PayCardBalanceData,
  type PayCardBalanceLabels,
} from "@features/flow-pay-card-balance";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";

type PayTabViewProps = {
  readonly top: number;
  readonly openHostedLogin: OpenHostedLogin;
  readonly featureTour: FeatureTourProps;
  readonly balance: PayCardBalanceData;
  readonly balanceLabels: PayCardBalanceLabels;
};

export function PayTabView({
  top,
  openHostedLogin,
  featureTour,
  balance,
  balanceLabels,
}: PayTabViewProps) {
  return (
    <Box
      lx={{ flex: 1, backgroundColor: "canvas" }}
      style={{ paddingTop: top }}
      testID="paytab-screen"
    >
      <TrackScreen category="Pay" balance_filter={balance.filter} />
      <PayCardBalance {...balance} labels={balanceLabels} />
      <CardLogin openHostedLogin={openHostedLogin} />
      <FeatureTour {...featureTour} />
    </Box>
  );
}
