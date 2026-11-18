import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft, Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state";
import { AddressActions } from "./components/AddressActions";
import { BlockedReceive } from "./components/BlockedReceive";
import { AddressOptionList } from "./components/AddressOptionList";
import { AddressSummary } from "./components/AddressSummary";
import { AddressSummarySkeleton } from "./components/AddressSummarySkeleton";
import { HelpPanel } from "./components/HelpPanel";
import { MemoPanel } from "./components/MemoPanel";
import { ReceiveAddressExtras } from "./components/ReceiveAddressExtras";
import { ReceiveAddressNotices } from "./components/ReceiveAddressNotices";
import { ReceiveAddressTitle } from "./components/ReceiveAddressTitle";
import { SanctionedAddress } from "./components/SanctionedAddress";
import { ServiceStatusPanel } from "./components/ServiceStatusPanel";
import { Dimmed } from "./components/Dimmed";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

const CONTENT_BOTTOM_SPACING = 16;

export function ReceiveAddressView({
  title,
  networkLabel,
  networkIcon,
  isLoading,
  error,
  sanctioned,
  blocked,
  addressSelection,
  address,
  actions,
  notices,
  serviceWarning,
  serviceStatus,
  memoCard,
  memoPanel,
  helpCard,
  helpPanel,
  onBack,
  onClose,
}: ReceiveAddressViewProps) {
  const { t } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();
  // While the verify hint is open, everything but the hint and the action tiles steps back.
  const isHintOpen = !!actions.verifyHint;

  return (
    <Box
      lx={{ flex: 1, backgroundColor: "canvas" }}
      style={{ paddingTop: top }}
      testID="receive-address"
    >
      <Dimmed isDimmed={isHintOpen}>
        <Box lx={{ alignItems: "flex-start", paddingHorizontal: "s4", paddingTop: "s8" }}>
          <IconButton
            icon={onBack ? ArrowLeft : Close}
            appearance="no-background"
            size="md"
            onPress={onBack ?? onClose}
            accessibilityLabel={onBack ? t("receiveAddress.back") : t("receiveAddress.close")}
            testID="receive-address-close"
          />
        </Box>
      </Dimmed>
      {addressSelection ? (
        <Box lx={{ gap: "s16", padding: "s16" }}>
          <Text typography="heading2SemiBold" lx={{ color: "base" }}>
            {addressSelection.title}
          </Text>
          <AddressOptionList
            options={addressSelection.options}
            onSelect={addressSelection.onSelect}
          />
        </Box>
      ) : (
        <ScrollView
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            gap: 24,
            paddingHorizontal: 16,
            // The scroll runs to the screen edge: the inset keeps the last zone above the home indicator.
            paddingBottom: CONTENT_BOTTOM_SPACING + bottom,
          }}
        >
          <Dimmed isDimmed={isHintOpen}>
            <ReceiveAddressTitle
              title={title}
              networkLabel={networkLabel}
              networkIcon={networkIcon}
            />
          </Dimmed>
          {blocked ? (
            <BlockedReceive blocked={blocked} />
          ) : sanctioned ? (
            <SanctionedAddress sanctioned={sanctioned} />
          ) : error ? (
            <InfoState
              preset="error"
              size="hug"
              title={error.title}
              description={error.description}
              primaryCta={{
                label: error.retryLabel,
                onPress: error.onRetry,
                testID: "receive-address-retry",
              }}
              testID="receive-address-error"
            />
          ) : (
            <>
              <Dimmed isDimmed={isHintOpen}>
                {isLoading || !address ? (
                  <AddressSummarySkeleton />
                ) : (
                  <AddressSummary
                    address={address}
                    onCopy={actions.copy?.onPressCode}
                    copyLabel={actions.copy?.label}
                    copyKey={actions.copy?.buttonPresses}
                  />
                )}
              </Dimmed>
              <AddressActions actions={actions} />
              <Dimmed isDimmed={isHintOpen}>
                <ReceiveAddressNotices notices={notices} serviceWarning={serviceWarning} />
              </Dimmed>
            </>
          )}
          <Dimmed isDimmed={isHintOpen}>
            <ReceiveAddressExtras memoCard={memoCard} helpCard={helpCard} />
          </Dimmed>
        </ScrollView>
      )}
      {serviceStatus ? <ServiceStatusPanel serviceStatus={serviceStatus} /> : null}
      {memoPanel ? <MemoPanel memoPanel={memoPanel} /> : null}
      {helpPanel ? <HelpPanel helpPanel={helpPanel} /> : null}
    </Box>
  );
}
