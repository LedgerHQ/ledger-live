import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { BottomSheetHeader, BottomSheetScrollView, Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState, type InfoStateProps } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import type { SignatureExtraProps } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/types";
import type { SignAndBroadcast } from "./useSignAndBroadcast";

type Props = Readonly<{
  flow: Omit<SignAndBroadcast, "showStep">;
  infoState: InfoStateProps;
  trackCategory: string;
  trackName: string;
  testID: string;
  accountId: string;
}>;

const DEVICE_CONNECTION_PARAMS = { acceptedDeviceModelIds: [] };

const SIGNATURE_EXTRA_PROPS: SignatureExtraProps = { sponsoredTransfer: false };

export function makeBroadcastingInfoState(title: string, testID: string): InfoStateProps {
  return {
    title,
    testID,
    preset: "text",
    content: (
      <Box lx={{ alignItems: "center" }}>
        <Spinner size={32} />
      </Box>
    ),
  };
}

export function SignAndBroadcastSheet(props: Props) {
  const { flow, infoState, trackCategory, trackName, testID, accountId } = props;

  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();

  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;

  return (
    <>
      <QueuedBottomSheet
        isRequestingToBeOpened={flow.isInfoSheetOpen}
        onClose={flow.onInfoSheetClose}
        onModalHide={flow.onInfoSheetHidden}
        noCloseButton={flow.isBroadcasting}
        preventBackdropClick={flow.isBroadcasting}
        enableDynamicSizing
        maxDynamicContentSize={maxDynamicContentSize}
        contentHasBottomSpace
        testID={testID}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <BottomSheetHeader />
          {flow.isInfoSheetOpen ? (
            <TrackScreen
              key={trackName}
              category={trackCategory}
              name={trackName}
              type="drawer"
              refreshSource={false}
            />
          ) : null}
          {flow.infoStep === "success" ? (
            <SyncOneAccountOnMount
              reason="transaction-flow-confirmation"
              priority={10}
              accountId={accountId}
            />
          ) : null}
          <Box lx={{ paddingHorizontal: "s16" }}>
            <InfoState size="hug" {...infoState} />
          </Box>
        </BottomSheetScrollView>
      </QueuedBottomSheet>
      {flow.signing ? (
        <DeviceIntentExecutor
          enabled
          sourceFlow="manage_assets"
          analyticsProperties={flow.analyticsProperties}
          deviceConnectionParams={DEVICE_CONNECTION_PARAMS}
          deviceInitializationInput={flow.signing.deviceInitializationInput}
          intent={flow.signing.intent}
          intentComponentExtraProps={SIGNATURE_EXTRA_PROPS}
          onIntentJobStateChanged={flow.onIntentJobStateChanged}
          onIntentJobComplete={flow.onIntentJobComplete}
          onUserCancel={flow.onUserCancel}
        />
      ) : null}
    </>
  );
}
