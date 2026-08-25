import React from "react";
import { Card, type CardProps } from "@features/flow-pay-card";
import { FeatureTour, type FeatureTourProps } from "@features/flow-pay-card-feature-tour";
import {
  Balance,
  type ActionTilesProps,
  type BalanceData,
  type BalanceLabels,
} from "@features/flow-pay-card-balance";
import { DepositOptions, type DepositOptionsProps } from "@features/flow-pay-card-deposit";
import { RequestReceive, type RequestReceiveProps } from "@features/flow-pay-card-request";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";

type PayTabViewProps = {
  readonly top: number;
  readonly oauthConfig: CardProps["oauthConfig"];
  readonly callback: CardProps["callback"];
  readonly featureTour: FeatureTourProps;
  readonly balance: BalanceData;
  readonly balanceLabels: BalanceLabels;
  readonly actionTiles: ActionTilesProps;
  readonly depositOptions: DepositOptionsProps;
  readonly requestReceive: RequestReceiveProps;
};

export function PayTabView({
  top,
  oauthConfig,
  callback,
  featureTour,
  balance,
  balanceLabels,
  actionTiles,
  depositOptions,
  requestReceive,
}: PayTabViewProps) {
  return (
    <Box
      lx={{ flex: 1, backgroundColor: "canvas" }}
      style={{ paddingTop: top }}
      testID="paytab-screen"
    >
      <TrackScreen category="Pay" balance_filter={balance.filter} />
      <Balance {...balance} labels={balanceLabels} actionTiles={actionTiles} />
      <DepositOptions {...depositOptions} />
      <RequestReceive {...requestReceive} />
      <Card oauthConfig={oauthConfig} callback={callback} />
      <FeatureTour {...featureTour} />
    </Box>
  );
}
