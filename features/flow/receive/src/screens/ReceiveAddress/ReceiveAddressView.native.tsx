import React, { useRef } from "react";
import { ScrollView, type View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft, Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { captureView } from "@shared/share-sheet";
import { InfoState } from "@shared/ui-info-state";
import { AddressActions } from "./components/AddressActions";
import { AddressOptionList } from "./components/AddressOptionList";
import { AddressSummary } from "./components/AddressSummary";
import { AddressSummarySkeleton } from "./components/AddressSummarySkeleton";
import { HelpPanel } from "./components/HelpPanel";
import { ReceiveAddressTitle } from "./components/ReceiveAddressTitle";
import { Dimmed } from "./components/Dimmed";
import { ReceiveAddressExtras } from "./components/ReceiveAddressExtras";
import { ReceiveAddressNotices } from "./components/ReceiveAddressNotices";
import { ServiceStatusPanel } from "./components/ServiceStatusPanel";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

export function ReceiveAddressView({
  title,
  networkLabel,
  networkIcon,
  isLoading,
  error,
  addressSelection,
  address,
  closeLabel,
  backLabel,
  actions,
  notices,
  serviceStatus,
  helpCard,
  helpPanel,
  onBack,
  onClose,
}: ReceiveAddressViewProps) {
  const { top, bottom } = useSafeAreaInsets();
  const isHintOpen = !!actions.verifyHint;
  const cardRef = useRef<View>(null);
  const { share } = actions;
  // Only this view holds the card: it captures it for Share.
  const actionsWithCard = share
    ? {
        ...actions,
        share: {
          ...share,
          onPress: () => void captureView(cardRef).then(share.onPress),
        },
      }
    : actions;

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
            accessibilityLabel={onBack ? backLabel : closeLabel}
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
          // The scroll runs to the screen edge: the inset keeps the last zone above the home indicator.
          contentContainerStyle={{ flexGrow: 1, paddingBottom: bottom }}
        >
          <Box lx={{ flexGrow: 1, gap: "s24", paddingHorizontal: "s16", paddingBottom: "s16" }}>
            <Box
              ref={cardRef}
              // Kept as a native view, for Share to capture it.
              collapsable={false}
              lx={{ gap: "s24", backgroundColor: "canvas" }}
              testID="receive-address-card"
            >
              <Dimmed isDimmed={isHintOpen}>
                <ReceiveAddressTitle
                  title={title}
                  networkLabel={networkLabel}
                  networkIcon={networkIcon}
                />
              </Dimmed>
              {error ? null : (
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
              )}
            </Box>
            {error ? (
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
                <AddressActions actions={actionsWithCard} />
                <Dimmed isDimmed={isHintOpen}>
                  <ReceiveAddressNotices notices={notices} />
                </Dimmed>
              </>
            )}
            <Dimmed isDimmed={isHintOpen}>
              <ReceiveAddressExtras helpCard={helpCard} />
            </Dimmed>
          </Box>
        </ScrollView>
      )}
      {serviceStatus ? <ServiceStatusPanel serviceStatus={serviceStatus} /> : null}
      {helpPanel ? <HelpPanel helpPanel={helpPanel} /> : null}
    </Box>
  );
}
