import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft, Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import { AddressActions } from "./components/AddressActions";
import { AddressOptionList } from "./components/AddressOptionList";
import { AddressSummary } from "./components/AddressSummary";
import { AddressSummarySkeleton } from "./components/AddressSummarySkeleton";
import { ReceiveAddressTitle } from "./components/ReceiveAddressTitle";
import { Dimmed } from "./components/Dimmed";
import { ZonePlaceholder } from "./components/ZonePlaceholder";
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
  onBack,
  onClose,
}: ReceiveAddressViewProps) {
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
            <Dimmed isDimmed={isHintOpen}>
              <ReceiveAddressTitle
                title={title}
                networkLabel={networkLabel}
                networkIcon={networkIcon}
              />
            </Dimmed>
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
                  <ZonePlaceholder zone="notices" />
                </Dimmed>
              </>
            )}
            <Dimmed isDimmed={isHintOpen}>
              <ZonePlaceholder zone="extras" />
            </Dimmed>
          </Box>
        </ScrollView>
      )}
    </Box>
  );
}
