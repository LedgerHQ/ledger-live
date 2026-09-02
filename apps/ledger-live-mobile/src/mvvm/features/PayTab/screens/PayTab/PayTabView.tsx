import React from "react";
import { ScrollView } from "react-native";
import { Card, type CardProps } from "@features/flow-pay-card";
import { FeatureTour, type FeatureTourProps } from "@features/flow-pay-feature-tour";
import { Balance, type ActionTilesProps, type BalanceData } from "@features/flow-pay-balance";
import { BankTransferIntro, type BankTransferIntroProps } from "@features/flow-pay-bank-transfer";
import { DepositOptions, type DepositOptionsProps } from "@features/flow-pay-deposit";
import { Contacts, type ContactsNativeProps } from "@features/flow-pay-contact";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Wallet40Background } from "LLM/components/Wallet40Background";
import { TrackScreen } from "~/analytics";

type PayTabViewProps = {
  readonly top: number;
  readonly bottom: number;
  readonly cardTitle: string;
  readonly cardBalanceLabel: string;
  readonly formatCountervalue: CardProps["formatCountervalue"];
  readonly resolveCardWalletCounterValue: CardProps["resolveCounterValue"];
  readonly oauthConfig: CardProps["oauthConfig"];
  readonly callback: CardProps["callback"];
  readonly featureTour: FeatureTourProps;
  readonly balance: BalanceData;
  readonly actionTiles: ActionTilesProps;
  readonly contacts: ContactsNativeProps;
  readonly isContactsEnabled: boolean;
  readonly depositOptions: DepositOptionsProps;
  readonly bankTransferIntro: BankTransferIntroProps;
};

export function PayTabView({
  top,
  bottom,
  cardTitle,
  cardBalanceLabel,
  formatCountervalue,
  resolveCardWalletCounterValue,
  oauthConfig,
  callback,
  featureTour,
  balance,
  actionTiles,
  contacts,
  isContactsEnabled,
  depositOptions,
  bankTransferIntro,
}: PayTabViewProps) {
  return (
    <Box lx={{ flex: 1 }} testID="paytab-screen">
      <Wallet40Background type="pay" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottom }}
      >
        <Box lx={{ flex: 1, gap: "s24", paddingHorizontal: "s16" }} style={{ paddingTop: top }}>
          <TrackScreen category="Pay" balance_filter={balance.filter} />
          <Balance {...balance} actionTiles={actionTiles} />
          {isContactsEnabled && <Contacts {...contacts} />}
          <Card
            title={cardTitle}
            oauthConfig={oauthConfig}
            callback={callback}
            formatCountervalue={formatCountervalue}
            balanceLabel={cardBalanceLabel}
            resolveCounterValue={resolveCardWalletCounterValue}
          />
          <FeatureTour {...featureTour} />
          <DepositOptions {...depositOptions} />
          <BankTransferIntro {...bankTransferIntro} />
        </Box>
      </ScrollView>
    </Box>
  );
}
