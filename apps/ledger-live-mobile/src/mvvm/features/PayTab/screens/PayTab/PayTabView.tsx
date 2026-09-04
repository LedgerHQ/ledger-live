import React from "react";
import { Card, type CardProps } from "@features/flow-pay-card";
import { FeatureTour, type FeatureTourProps } from "@features/flow-pay-feature-tour";
import { Balance, type ActionTilesProps, type BalanceData } from "@features/flow-pay-balance";
import { DepositOptions, type DepositOptionsProps } from "@features/flow-pay-deposit";
import { Contacts, type ContactsNativeProps } from "@features/flow-pay-contact";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Wallet40Background } from "LLM/components/Wallet40Background";
import { TrackScreen } from "~/analytics";

type PayTabViewProps = {
  readonly top: number;
  readonly cardTitle: string;
  readonly oauthConfig: CardProps["oauthConfig"];
  readonly callback: CardProps["callback"];
  readonly featureTour: FeatureTourProps;
  readonly balance: BalanceData;
  readonly actionTiles: ActionTilesProps;
  readonly contacts: ContactsNativeProps;
  readonly depositOptions: DepositOptionsProps;
};

export function PayTabView({
  top,
  cardTitle,
  oauthConfig,
  callback,
  featureTour,
  balance,
  actionTiles,
  contacts,
  depositOptions,
}: PayTabViewProps) {
  return (
    <Box lx={{ flex: 1 }} testID="paytab-screen">
      <Wallet40Background type="pay" />
      <Box lx={{ flex: 1, gap: "s24", paddingHorizontal: "s16" }} style={{ paddingTop: top }}>
        <TrackScreen category="Pay" balance_filter={balance.filter} />
        <Balance {...balance} actionTiles={actionTiles} />
        <Contacts {...contacts} />
        <Card title={cardTitle} oauthConfig={oauthConfig} callback={callback} />
        <FeatureTour {...featureTour} />
        <DepositOptions {...depositOptions} />
      </Box>
    </Box>
  );
}
