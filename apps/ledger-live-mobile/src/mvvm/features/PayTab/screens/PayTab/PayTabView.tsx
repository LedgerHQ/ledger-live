import React from "react";
import { Card, type CardProps } from "@features/flow-pay-card";
import { FeatureTour } from "@features/flow-pay-feature-tour";
import { Balance, type ActionTilesProps, type BalanceData } from "@features/flow-pay-balance";
import { BankTransferIntro, type BankTransferIntroProps } from "@features/flow-pay-bank-transfer";
import { DepositOptions, type DepositOptionsProps } from "@features/flow-pay-deposit";
import {
  ContactAddressPicker,
  Contacts,
  type ContactAddressPickerProps,
  type ContactsNativeProps,
} from "@features/flow-pay-contact";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Wallet40Background } from "LLM/components/Wallet40Background";
import { TrackScreen } from "~/analytics";
import { ScrollView } from "react-native";

type PayTabViewProps = {
  readonly top: number;
  readonly bottom: number;
  readonly card: CardProps;
  readonly balance: BalanceData;
  readonly actionTiles: ActionTilesProps;
  readonly contacts: ContactsNativeProps;
  readonly contactAddressPicker: ContactAddressPickerProps;
  readonly isContactsEnabled: boolean;
  readonly depositOptions: DepositOptionsProps;
  readonly bankTransferIntro: BankTransferIntroProps;
  readonly trackRecipientAddressSelection: boolean;
  readonly disclaimer: string;
};

export function PayTabView({
  top,
  bottom,
  card,
  balance,
  actionTiles,
  contacts,
  contactAddressPicker,
  isContactsEnabled,
  depositOptions,
  bankTransferIntro,
  trackRecipientAddressSelection,
  disclaimer,
}: PayTabViewProps) {
  return (
    <Box lx={{ flex: 1 }} testID="paytab-screen">
      <Wallet40Background type="pay" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: top,
          paddingBottom: bottom + 16,
        }}
      >
        <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
          <TrackScreen
            category="Pay"
            balanceFilter={
              balance.filterOptions
                .find(option => option.id === balance.filter)
                ?.ticker?.toLowerCase() ?? balance.filter
            }
          />
          <Balance {...balance} actionTiles={actionTiles} />
          {isContactsEnabled && <Contacts {...contacts} />}
          {trackRecipientAddressSelection && (
            <TrackScreen category="Recipient address selection" refreshSource={false} />
          )}
          <ContactAddressPicker {...contactAddressPicker} />
          <Card {...card} />
          <FeatureTour />
          <DepositOptions {...depositOptions} />
          <BankTransferIntro {...bankTransferIntro} />

          <Text
            typography="body3"
            lx={{ color: "muted", textAlign: "center", marginTop: "s16" }}
            testID="pay-disclaimer"
          >
            {disclaimer}
          </Text>
        </Box>
      </ScrollView>
    </Box>
  );
}
