import React from "react";
import { Card, type CardProps } from "@features/flow-pay-card";
import { FeatureTour, type FeatureTourProps } from "@features/flow-pay-feature-tour";
import { Balance, type ActionTilesProps, type BalanceData } from "@features/flow-pay-balance";
import { BankTransferIntro, type BankTransferIntroProps } from "@features/flow-pay-bank-transfer";
import { DepositOptions, type DepositOptionsProps } from "@features/flow-pay-deposit";
import {
  ContactAddressPicker,
  Contacts,
  type ContactAddressPickerProps,
  type ContactsNativeProps,
} from "@features/flow-pay-contact";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Wallet40Background } from "LLM/components/Wallet40Background";
import { TrackScreen } from "~/analytics";
import { ScrollView } from "react-native";

type PayTabViewProps = {
  readonly top: number;
  readonly bottom: number;
  readonly cardTitle: string;
  readonly oauthConfig: CardProps["oauthConfig"];
  readonly callback: CardProps["callback"];
  readonly featureTour: FeatureTourProps;
  readonly balance: BalanceData;
  readonly actionTiles: ActionTilesProps;
  readonly contacts: ContactsNativeProps;
  readonly contactAddressPicker: ContactAddressPickerProps;
  readonly isContactsEnabled: boolean;
  readonly depositOptions: DepositOptionsProps;
  readonly bankTransferIntro: BankTransferIntroProps;
};

export function PayTabView({
  top,
  cardTitle,
  bottom,
  oauthConfig,
  callback,
  featureTour,
  balance,
  actionTiles,
  contacts,
  contactAddressPicker,
  isContactsEnabled,
  depositOptions,
  bankTransferIntro,
}: PayTabViewProps) {
  return (
    <Box lx={{ flex: 1 }} testID="paytab-screen">
      <Wallet40Background type="pay" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingTop: top, paddingBottom: bottom }}
      >
        <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
          <TrackScreen category="Pay" balance_filter={balance.filter} />
          <Balance {...balance} actionTiles={actionTiles} />
          {isContactsEnabled && <Contacts {...contacts} />}
          <ContactAddressPicker {...contactAddressPicker} />
          <Card
            title={cardTitle}
            oauthConfig={oauthConfig}
            callback={callback}
            onTrackEvent={balance.onTrackEvent}
          />
          <FeatureTour {...featureTour} />
          <DepositOptions {...depositOptions} />
          <BankTransferIntro {...bankTransferIntro} />
        </Box>
      </ScrollView>
    </Box>
  );
}
