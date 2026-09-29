import React from "react";
import { Card, type CardProps } from "@features/flow-pay-card";
import { FeatureTour } from "@features/flow-pay-feature-tour";
import {
  ActionTiles,
  Balance,
  type ActionTilesProps,
  type BalanceData,
} from "@features/flow-pay-balance";
import { BankTransferIntro, type BankTransferIntroProps } from "@features/flow-pay-bank-transfer";
import { DepositOptions, type DepositOptionsProps } from "@features/flow-pay-deposit";
import {
  ContactAddressPicker,
  Contacts,
  type ContactAddressPickerProps,
  type ContactsNativeProps,
} from "@features/flow-pay-contact";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Wallet40Background, useScrollOffset } from "LLM/components/Wallet40Background";
import { ScreenHeroSectionView } from "LLM/components/ScreenHeroSection/ScreenHeroSectionView";
import { TrackScreen } from "~/analytics";
import Animated from "react-native-reanimated";

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
  const { scrollY, onScroll } = useScrollOffset();

  return (
    <Box lx={{ flex: 1 }} testID="paytab-screen">
      <Wallet40Background type="pay" scrollY={scrollY} />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: top,
          paddingBottom: bottom + 16,
        }}
      >
        <TrackScreen
          category="Pay"
          balanceFilter={
            balance.filterOptions
              .find(option => option.id === balance.filter)
              ?.ticker?.toLowerCase() ?? balance.filter
          }
        />
        <ScreenHeroSectionView ctas={<ActionTiles {...actionTiles} />}>
          <Balance {...balance} />
        </ScreenHeroSectionView>
        <Box lx={{ gap: "s24", paddingHorizontal: "s16", marginTop: "s24" }}>
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
      </Animated.ScrollView>
    </Box>
  );
}
