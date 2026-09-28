import React from "react";
import { StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { DeviceIntentExecutorLWM } from "LLM/components/DeviceIntentExecutor";
import InfiniteLoader from "~/components/InfiniteLoader";
import { useTranslation } from "~/context/Locale";
import { useSponsoredRentSignatureViewModel } from "./hooks/useSponsoredRentSignatureViewModel";

const deviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

export function SponsoredRentSignatureScreen() {
  const { t } = useTranslation();
  const {
    isCrafting,
    feeAmountLabel,
    deviceInitializationInput,
    signIntent,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  } = useSponsoredRentSignatureViewModel();

  if (isCrafting || !deviceInitializationInput || !signIntent) {
    return (
      <Flex
        style={StyleSheet.absoluteFill}
        bg="background.main"
        alignItems="center"
        justifyContent="center"
        rowGap={16}
      >
        <InfiniteLoader testID="sponsored-rent-crafting-loader" />
        <Text variant="body" color="neutral.c80">
          {t("newSendFlow.sponsoredRentSignature.crafting")}
        </Text>
        {feeAmountLabel ? (
          <Text variant="bodyLineHeight" fontWeight="semiBold" color="neutral.c100">
            {feeAmountLabel}
          </Text>
        ) : null}
      </Flex>
    );
  }

  return (
    <DeviceIntentExecutorLWM
      enabled
      sourceFlow="send"
      deviceConnectionParams={deviceConnectionParams}
      deviceInitializationInput={deviceInitializationInput}
      intent={signIntent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      onIntentJobStateChanged={onIntentJobStateChanged}
      onIntentJobComplete={noop}
      onIntentJobError={onIntentJobError}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
