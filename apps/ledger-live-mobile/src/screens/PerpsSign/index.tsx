import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Flex, Text, Button, Tag } from "@ledgerhq/native-ui";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import GenericErrorView from "~/components/GenericErrorView";
import {
  RootComposite,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import Animation from "~/components/Animation";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import { getProductName } from "LLM/utils/getProductName";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import DeviceActionModal from "~/components/DeviceActionModal";
import { useAppDeviceAction } from "~/hooks/deviceActions";

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
  const [error, setError] = useState<Error | null>(null);
  const hasHandledSuccessRef = useRef(false);

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

  const handleAppResult = useCallback(
    (result: AppResult) => {
      if (hasHandledSuccessRef.current) return;
      hasHandledSuccessRef.current = true;
      setConnectedDevice(result.device);
    },
    [],
  );

  const resetDevice = useCallback(() => {
    setSelectedDevice(undefined);
  }, []);

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

  // Phase 2: signing — triggered when connectedDevice is set
  useEffect(() => {
    if (!connectedDevice) return;

    let cancelled = false;

    signFactory(connectedDevice)
      .then(result => {
        if (cancelled) return;
        onSuccess(result);
        navigation.goBack();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError(e);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedDevice]);

  const handleClose = () => {
    if (!error) {
      onCancel();
    }
    navigation.goBack();
  };

  if (error) {
    return (
      <Flex flex={1} alignItems="center" justifyContent="center" p={6}>
        <GenericErrorView
          error={error}
          hasExportLogButton={false}
          footerComponent={
            <Button type="main" onPress={handleClose} alignSelf="stretch" mt={6}>
              {t("common.close")}
            </Button>
          }
        />
      </Flex>
    );
  }

  // Phase 2: signing animation
  if (connectedDevice) {
    const productName = getProductName(connectedDevice.modelId);
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ backgroundColor: colors.background }}
      >
        <Flex flex={1} alignItems="center" justifyContent="center" p={6} rowGap={4}>
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
            {t("SignMessageConfirm.title", { wording: productName })}
          </Text>
          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
            {t("SignMessageConfirm.description")}
          </Text>
        </Flex>
      </ScrollView>
    );
  }

  // Phase 1: device selection + app connection
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <Flex px={16} py={5} flex={1}>
        <SelectDevice2
          onSelect={setSelectedDevice}
          stopBleScanning={!!selectedDevice}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
        />
      </Flex>
      <DeviceActionModal
        action={action}
        device={selectedDevice}
        onResult={handleAppResult}
        onClose={resetDevice}
        request={request}
        analyticsPropertyFlow={"perps sign"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
