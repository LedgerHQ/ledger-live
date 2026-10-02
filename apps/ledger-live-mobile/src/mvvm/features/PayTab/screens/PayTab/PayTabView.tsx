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
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Wallet40Background, useScrollOffset } from "LLM/components/Wallet40Background";
import { ScreenHeroSectionView } from "LLM/components/ScreenHeroSection/ScreenHeroSectionView";
import { TrackScreen } from "~/analytics";
import Animated from "react-native-reanimated";
import { CardDisclaimer } from "./CardDisclaimer";
import { PayDisclaimer } from "./PayDisclaimer";
import type { PayTabCardState } from "./usePayTabCardState";

type PayTabViewProps = {
  readonly top: number;
  readonly bottom: number;
  readonly card: CardProps;
  readonly cardState: PayTabCardState;
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
  cardState,
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
        <Box lx={{ flex: 1 }}>
          <Box lx={{ gap: "s24", paddingHorizontal: "s16", marginTop: "s24" }}>
            {isContactsEnabled && <Contacts {...contacts} />}
            {trackRecipientAddressSelection && (
              <TrackScreen category="Recipient address selection" refreshSource={false} />
            )}
            <ContactAddressPicker {...contactAddressPicker} />
            {(cardState.status === "native" || cardState.status === "liveApp") && (
              <Card {...card} />
            )}
            <FeatureTour />
            <DepositOptions {...depositOptions} />
            <BankTransferIntro {...bankTransferIntro} />

            {cardState.status === "native" && <PayDisclaimer text={disclaimer} />}
          </Box>
          {cardState.status === "disclaimer" && (
            <CardDisclaimer
              text={cardState.text}
              link={cardState.link}
              onPress={cardState.onPress}
            />
          )}
        </Box>
      </Animated.ScrollView>
    </Box>
  );
}
