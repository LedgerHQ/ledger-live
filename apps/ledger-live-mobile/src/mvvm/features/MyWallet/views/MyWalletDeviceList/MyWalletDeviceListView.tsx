import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ConnectKnownOrNewDevice } from "LLM/components/ConnectKnownOrNewDevice";
import { LNUpsellBanner } from "LLM/features/LNUpsell";
import DeviceActionModal from "~/components/DeviceActionModal";
import { DeviceLockedCheckDrawer } from "~/components/SelectDevice2/DeviceLockedCheckDrawer";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { ExploreDevicesRow } from "./components/ExploreDevicesRow";
import type { MyWalletDeviceListViewProps } from "./types";

export function MyWalletDeviceListView({
  isAdding,
  topInset,
  isPaused,
  onConnected,
  onAddModeChange,
  onDeviceNotFound,
  onAddDevice,
  onExploreDevices,
  deviceToCheck,
  onDeviceUnlocked,
  onCloseLockedCheck,
  device,
  action,
  onResult,
  onCloseModal,
  onModalHide,
}: Readonly<MyWalletDeviceListViewProps>) {
  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.content, isAdding && { paddingTop: topInset }]}
        testID="my-wallet-device-list"
        alwaysBounceVertical={false}
      >
        {/* The same parent in the Add mode, so that the component does not remount. */}
        <View style={isAdding ? styles.fill : undefined}>
          <ConnectKnownOrNewDevice
            onConnected={onConnected}
            onAddModeChange={onAddModeChange}
            isPaused={isPaused}
            onDeviceNotFound={onDeviceNotFound}
            onAddDevice={onAddDevice}
            listFooter={<ExploreDevicesRow onPress={onExploreDevices} />}
          >
            <LNUpsellBanner location="profile" />
          </ConnectKnownOrNewDevice>
        </View>
      </ScrollView>
      <DeviceLockedCheckDrawer
        isOpen={deviceToCheck !== null}
        device={deviceToCheck}
        onDeviceUnlocked={onDeviceUnlocked}
        onClose={onCloseLockedCheck}
      />
      <DeviceActionModal
        device={device}
        action={action}
        request={null}
        onResult={onResult}
        onClose={onCloseModal}
        onModalHide={onModalHide}
        location={HOOKS_TRACKING_LOCATIONS.myLedgerDashboard}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 16 },
  fill: { flex: 1 },
});
