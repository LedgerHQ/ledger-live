import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Alert, Flex, Text, Tag } from "@ledgerhq/native-ui";
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
import QueuedDrawer from "~/components/QueuedDrawer";
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
      <Flex px={16} py={5} flex={1}>
        <SelectDevice2
          onSelect={setSelectedDevice}
          stopBleScanning={!!selectedDevice}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          autoSelectLastConnectedDevice
        />
      </Flex>
      <QueuedDrawer
        isRequestingToBeOpened={drawerOpen}
        onClose={handleDrawerClose}
        onModalHide={handleDrawerHidden}
        preventBackdropClick={!!connectedDevice}
      >
        {connectedDevice ? (
          <Flex alignItems="center" p={6} rowGap={4}>
            <Animation
              source={getDeviceAnimation({ modelId: connectedDevice.modelId, key: "sign", theme })}
              style={getDeviceAnimationStyles(connectedDevice.modelId)}
            />
            {connectedDevice.deviceName ? (
              <Tag my={8} uppercase={false}>
                {connectedDevice.deviceName}
              </Tag>
            ) : null}
            <Text variant="h4" fontWeight="semiBold" textAlign="center" mt={4}>
              {t("ValidateOnDevice.title.send", {
                productName: getProductName(connectedDevice.modelId),
              })}
            </Text>
          </Flex>
        ) : (
          selectedDevice && (
            <Flex alignItems="center" testID="device-action-modal">
              <Flex flexDirection="row" mb={showInfo ? "16px" : 0}>
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
              </Flex>
              {showInfo && <Alert type="info" title={t("DeviceAction.stayInTheAppPlz")} />}
            </Flex>
          )
        )}
        {selectedDevice && <SyncSkipUnderPriority priority={100} />}
      </QueuedDrawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
