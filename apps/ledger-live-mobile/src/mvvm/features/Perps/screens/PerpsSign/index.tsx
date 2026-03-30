import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Banner, BottomSheetView, Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import type { Action, Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import Animation from "~/components/Animation";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { getProductName } from "LLM/utils/getProductName";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import DeviceAction from "~/components/DeviceAction";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { PartialNullable } from "~/types/helpers";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsSign>
>;

export default function PerpsSign({ navigation, route }: NavigationProps) {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const theme = dark ? "dark" : "light";
  const { appName, appOptions, signFactory, onSuccess, onError, onCancel } = route.params;

  const [selectedDevice, setSelectedDevice] = useState<Device | null | undefined>();
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const completedRef = useRef(false);

  const action = useAppDeviceAction();
  const request = useMemo(
    () => ({
      appName,
      requireLatestFirmware: appOptions?.requireLatestFirmware,
      allowPartialDependencies: appOptions?.allowPartialDependencies,
      skipAppInstallIfNotFound: appOptions?.skipAppInstallIfNotFound,
    }),
    [appName, appOptions],
  );

  const drawerOpen = !!selectedDevice;
  const showInfo = !selectedDevice?.wired;

  const handleAppResult = useCallback((result: AppResult) => {
    setConnectedDevice(result.device);
  }, []);

  const handleDrawerClose = useCallback(() => {
    if (!completedRef.current) {
      onCancel();
    }
    setSelectedDevice(undefined);
  }, [onCancel]);

  const handleDrawerHidden = useCallback(() => {
    if (completedRef.current) {
      navigation.goBack();
    }
  }, [navigation]);

  const requestToSetHeaderOptions = useCallback(
    (req: SetHeaderOptionsRequest) => {
      if (req.type === "set") {
        navigation.setOptions({
          headerShown: true,
          headerLeft: req.options.headerLeft,
          headerRight: req.options.headerRight,
        });
      } else {
        navigation.setOptions({
          headerLeft: () => null,
          headerRight: () => null,
        });
      }
    },
    [navigation],
  );

  useEffect(() => {
    if (!connectedDevice) return;

    let cancelled = false;

    signFactory(connectedDevice)
      .then(result => {
        if (cancelled) return;
        completedRef.current = true;
        onSuccess(result);
        setSelectedDevice(undefined);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        completedRef.current = true;
        const e = err instanceof Error ? err : new Error(String(err));
        onError(e);
        setSelectedDevice(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [connectedDevice]);

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.root, { backgroundColor: colors.background }]}>
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
                {t("ValidateOnDevice.title.send", {
                  productName: getProductName(connectedDevice.modelId),
                })}
              </Text>
            </Box>
          ) : (
            selectedDevice && (
              <Box lx={{ alignItems: "center" }} testID="device-action-modal">
                <Box lx={{ flexDirection: "row", marginBottom: showInfo ? "s16" : "s0" }}>
                  <DeviceAction
                    action={
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
