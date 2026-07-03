import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import SelectDevice2, { type SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { SigningBody } from "./components/SigningBody";

type SignatureDeviceActionViewModel = ReturnType<
  typeof import("../../hooks/useSignatureDeviceActionViewModel").useSignatureDeviceActionViewModel
>;

type SignatureDeviceActionViewProps = Pick<
  SignatureDeviceActionViewModel,
  | "account"
  | "parentAccount"
  | "request"
  | "action"
  | "selectedDevice"
  | "setSelectedDevice"
  | "onDeviceActionResultCompleted"
  | "onUserCancel"
>;

// SelectDevice2 can request to override the navigation header during the BLE pairing flow. Inside
// the signature overlay we do not own a dedicated header, and auto-selection means the pairing flow
// is rarely reached, so header override requests are intentionally ignored here.
const ignoreHeaderOptions = (_request: SetHeaderOptionsRequest) => undefined;

export function SignatureDeviceActionView({
  account,
  parentAccount,
  request,
  action,
  selectedDevice,
  setSelectedDevice,
  onDeviceActionResultCompleted,
  onUserCancel,
}: SignatureDeviceActionViewProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { track } = useAnalytics();

  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  useEffect(() => {
    track("send_modal", {
      ...trackingProperties,
      name: "step review device",
      flow: "send",
    });
  }, [track, trackingProperties]);

  return (
    <View style={{ flex: 1 }} testID="send-signature-step">
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened
        onClose={onUserCancel}
        preventBackdropClick={!!selectedDevice}
        hideHandle
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
          {selectedDevice && request ? (
            <SigningBody
              device={selectedDevice}
              action={action}
              request={request}
              onResult={onDeviceActionResultCompleted}
              onClose={onUserCancel}
            />
          ) : (
            <SelectDevice2
              onSelect={setSelectedDevice}
              stopBleScanning={!!selectedDevice}
              requestToSetHeaderOptions={ignoreHeaderOptions}
              autoSelectLastConnectedDevice
            />
          )}
          {selectedDevice ? <SyncSkipUnderPriority priority={100} /> : null}
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </View>
  );
}
