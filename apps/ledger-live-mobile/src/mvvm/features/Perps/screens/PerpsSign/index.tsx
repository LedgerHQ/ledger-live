import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Banner, BottomSheetView, Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import type { Action } from "@ledgerhq/live-common/hw/actions/types";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Animation from "~/components/Animation";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { getProductName } from "LLM/utils/getProductName";
import SelectDevice2 from "~/components/SelectDevice2";
import DeviceAction from "~/components/DeviceAction";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { PartialNullable } from "~/types/helpers";
import type { PerpsSignViewModel } from "./usePerpsSignViewModel";

export function PerpsSignView({
  t,
  backgroundColor,
  theme,
  selectedDevice,
  connectedDevice,
  drawerOpen,
  showInfo,
  action,
  request,
  setSelectedDevice,
  handleAppResult,
  handleDrawerClose,
  handleDrawerHidden,
  requestToSetHeaderOptions,
}: Readonly<PerpsSignViewModel>) {
  return (
    <SafeAreaView edges={["bottom"]} style={[styles.root, { backgroundColor }]}>
      <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s8", flex: 1 }}>
        <SelectDevice2
          onSelect={setSelectedDevice}
          stopBleScanning={!!selectedDevice}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          autoSelectLastConnectedDevice
        />
      </Box>
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={drawerOpen}
        onClose={handleDrawerClose}
        onModalHide={handleDrawerHidden}
        preventBackdropClick={!!connectedDevice}
        enableDynamicSizing
      >
        <BottomSheetView>
          {connectedDevice ? (
            <Box lx={{ alignItems: "center", padding: "s24", gap: "s16" }}>
              <Animation
                source={getDeviceAnimation({
                  modelId: connectedDevice.modelId,
                  key: "sign",
                  theme,
                })}
                style={getDeviceAnimationStyles(connectedDevice.modelId)}
              />
              {connectedDevice.deviceName ? (
                <Tag size="md" appearance="gray" label={connectedDevice.deviceName} />
              ) : null}
              <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {t("send.newSendFlow.sign.title", {
                  wording: getProductName(connectedDevice.modelId),
                })}
              </Text>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                {t("send.newSendFlow.sign.description")}
              </Text>
            </Box>
          ) : (
            selectedDevice && (
              <Box lx={{ alignItems: "center" }} testID="device-action-modal">
                <Box lx={{ flexDirection: "row", marginBottom: showInfo ? "s16" : "s0" }}>
                  <DeviceAction
                    action={
                      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
                      action as unknown as Action<
                        typeof request,
                        PartialNullable<Record<string, unknown>>,
                        AppResult
                      >
                    }
                    device={selectedDevice}
                    request={request}
                    onResult={handleAppResult}
                    analyticsPropertyFlow="perps sign"
                    onClose={handleDrawerClose}
                  />
                </Box>
                {showInfo && <Banner appearance="info" title={t("DeviceAction.stayInTheAppPlz")} />}
              </Box>
            )
          )}
          {selectedDevice && <SyncSkipUnderPriority priority={100} />}
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
