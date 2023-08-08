import React, { useState, useCallback, useEffect } from "react";
import { Platform, Linking } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Alert, Text, Flex, IconsLegacy, IconBadge, ProgressLoader } from "@ledgerhq/native-ui";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StackNavigationProp } from "@react-navigation/stack";
import { BatteryStatusTypes } from "@ledgerhq/live-common/hw/getBatteryStatus";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import useLatestFirmware from "@ledgerhq/live-common/hooks/useLatestFirmware";
import { useBatteryStatuses } from "@ledgerhq/live-common/deviceSDK/hooks/useBatteryStatuses";
import { BatteryStatusFlags } from "@ledgerhq/types-devices";

import { ScreenName, NavigatorName } from "../const";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
} from "../reducers/settings";
import { hasConnectedDeviceSelector } from "../reducers/appstate";
import Button from "./Button";
import QueuedDrawer from "./QueuedDrawer";
import InvertTheme from "./theme/InvertTheme";
import { urls } from "../config/urls";
import { renderConnectYourDevice } from "./DeviceAction/rendering";
import { DeviceActionError } from "./DeviceAction/common";
import { UpdateStep } from "../screens/FirmwareUpdate";

export type FirmwareUpdateBannerProps = {
  onBackFromUpdate: (updateState: UpdateStep) => void;
};

const requiredBatteryStatuses = [
  BatteryStatusTypes.BATTERY_PERCENTAGE,
  BatteryStatusTypes.BATTERY_FLAGS,
];

const FirmwareUpdateBanner = ({ onBackFromUpdate }: FirmwareUpdateBannerProps) => {
  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(lastSeenDeviceSelector);

  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(hasCompletedOnboardingSelector);

  const { dark } = useTheme();
  const theme: "dark" | "light" = dark ? "dark" : "light";
  const [disableUpdateButton, setDisableUpdateButton] = useState(false);
  const [showBatteryWarningDrawer, setShowBatteryWarningDrawer] = useState<boolean>(false);

  const [showUnsupportedUpdateDrawer, setShowUnsupportedUpdateDrawer] = useState<boolean>(false);

  const { t } = useTranslation();

  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();

  const newFwUpdateUxFeatureFlag = useFeature("llmNewFirmwareUpdateUx");

  const latestFirmware = useLatestFirmware(lastSeenDevice?.deviceInfo);

  const {
    requestCompleted: batteryRequestCompleted,
    batteryStatusesState,
    triggerRequest: triggerBatteryCheck,
    cancelRequest: cancelBatteryCheck,
  } = useBatteryStatuses({
    deviceId: lastConnectedDevice?.deviceId,
    statuses: requiredBatteryStatuses,
  });

  const onExperimentalFirmwareUpdate = useCallback(() => {
    if (newFwUpdateUxFeatureFlag?.enabled) {
      navigation.navigate(NavigatorName.Manager, {
        screen: ScreenName.FirmwareUpdate,
        params: {
          device: lastConnectedDevice,
          deviceInfo: lastSeenDevice?.deviceInfo,
          firmwareUpdateContext: latestFirmware,
          onBackFromUpdate: (updateState: UpdateStep) => {
            cancelBatteryCheck();
            if (onBackFromUpdate) onBackFromUpdate(updateState);
          },
        },
      });
      return;
    }

    // if we're already in the manager page, only update the params
    if (route.name === ScreenName.ManagerMain) {
      navigation.setParams({ firmwareUpdate: true });
    } else {
      navigation.navigate(NavigatorName.Manager, {
        screen: ScreenName.Manager,
        params: { firmwareUpdate: true },
      });
    }

    setShowUnsupportedUpdateDrawer(false);
  }, [
    newFwUpdateUxFeatureFlag?.enabled,
    route.name,
    navigation,
    lastConnectedDevice,
    lastSeenDevice?.deviceInfo,
    latestFirmware,
    cancelBatteryCheck,
    onBackFromUpdate,
  ]);

  // Effect that will check the battery of stax before triggering the update and display a warning preventing the update
  // in case the battery is too low and the device is not charging
  useEffect(() => {
    if (batteryRequestCompleted && batteryStatusesState.error === null) {
      const [percentage, statusFlags] = batteryStatusesState.batteryStatuses as [
        number,
        BatteryStatusFlags,
      ];

      percentage < 20 && statusFlags.charging === 0
        ? setShowBatteryWarningDrawer(true)
        : onExperimentalFirmwareUpdate();

      setDisableUpdateButton(false);
    }
  }, [
    batteryRequestCompleted,
    batteryStatusesState.batteryStatuses,
    batteryStatusesState.error,
    onExperimentalFirmwareUpdate,
  ]);

  const showBanner = Boolean(latestFirmware);
  const version = latestFirmware?.final?.name ?? "";

  const onCloseUsbWarningDrawer = useCallback(() => {
    setShowUnsupportedUpdateDrawer(false);
  }, []);

  const onOpenReleaseNotes = useCallback(() => {
    if (lastConnectedDevice) {
      Linking.openURL(urls.fwUpdateReleaseNotes[lastConnectedDevice?.modelId]);
    }
  }, [lastConnectedDevice]);

  const isUsbFwVersionUpdateSupported =
    lastSeenDevice &&
    isFirmwareUpdateVersionSupported(lastSeenDevice.deviceInfo, lastSeenDevice.modelId);

  const wiredDevice = lastConnectedDevice?.wired === true;

  const usbFwUpdateActivated = Platform.OS === "android" && isUsbFwVersionUpdateSupported;

  const fwUpdateActivatedButNotWired = usbFwUpdateActivated && !wiredDevice;

  const onClickUpdate = useCallback(() => {
    // Path with Stax and the new firmware update flow (can be BLE or wired)
    if (lastConnectedDevice?.modelId === DeviceModelId.stax && newFwUpdateUxFeatureFlag?.enabled) {
      // This leads to a check on the battery before triggering update, it is only necessary for Stax and on the new UX
      // (because it's the only type of update that can happen via BLE)
      setDisableUpdateButton(true);
      triggerBatteryCheck();
    }
    // Path with any device model, wired and on android
    else if (isUsbFwVersionUpdateSupported && wiredDevice && Platform.OS === "android") {
      onExperimentalFirmwareUpdate();
    } else {
      setShowUnsupportedUpdateDrawer(true);
    }
  }, [
    lastConnectedDevice?.modelId,
    newFwUpdateUxFeatureFlag?.enabled,
    isUsbFwVersionUpdateSupported,
    wiredDevice,
    triggerBatteryCheck,
    onExperimentalFirmwareUpdate,
  ]);

  const deviceName = lastConnectedDevice
    ? getDeviceModel(lastConnectedDevice.modelId).productName
    : "";

  return showBanner && hasCompletedOnboarding && hasConnectedDevice ? (
    <>
      {newFwUpdateUxFeatureFlag?.enabled ? (
        <Flex backgroundColor="neutral.c100" borderRadius={8} px={5} py={6}>
          <Flex flexDirection="row" alignItems="center" mb={5}>
            <IconsLegacy.CloudDownloadMedium color="neutral.c00" size={32} />
            <Text ml={5} flexShrink={1} flexGrow={1} color="neutral.c00" fontWeight="semiBold">
              {t("FirmwareUpdate.newVersion", {
                version,
                deviceName,
              })}
            </Text>
          </Flex>
          <InvertTheme>
            <Flex flexDirection="row">
              <Button
                flex={1}
                outline
                event="button_clicked"
                eventProperties={{ button: "Learn more" }}
                type="main"
                title={t("common.learnMore")}
                onPress={onOpenReleaseNotes}
              />
              <Button
                ml={3}
                flex={1}
                event="button_clicked"
                eventProperties={{ button: "Update" }}
                disabled={disableUpdateButton}
                type="main"
                title={!disableUpdateButton ? t("FirmwareUpdate.update") : null}
                onPress={onClickUpdate}
                outline={false}
              >
                {disableUpdateButton && <ProgressLoader infinite radius={10} strokeWidth={2} />}
              </Button>
            </Flex>
          </InvertTheme>
        </Flex>
      ) : (
        <Flex mt={5}>
          <Alert type="info" showIcon={false}>
            <Text flexShrink={1} flexGrow={1}>
              {t("FirmwareUpdate.newVersion", {
                version,
                deviceName,
              })}
            </Text>
            <Button
              ml={5}
              event="button_clicked"
              eventProperties={{ button: "Update" }}
              type="color"
              title={t("FirmwareUpdate.update")}
              onPress={onClickUpdate}
              outline={false}
            />
          </Alert>
        </Flex>
      )}

      <QueuedDrawer
        isRequestingToBeOpened={showUnsupportedUpdateDrawer}
        onClose={onCloseUsbWarningDrawer}
        Icon={fwUpdateActivatedButNotWired ? UsbMedium : DownloadMedium}
        title={
          fwUpdateActivatedButNotWired
            ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbTitle")
            : t("FirmwareUpdate.drawerUpdate.title")
        }
        description={
          fwUpdateActivatedButNotWired
            ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbDescription", {
                deviceName,
              })
            : t("FirmwareUpdate.drawerUpdate.description")
        }
        noCloseButton
      >
        <Button type="primary" title={t("common.close")} onPress={onCloseUsbWarningDrawer} />
      </QueuedDrawer>
      <QueuedDrawer
        isRequestingToBeOpened={showBatteryWarningDrawer}
        onClose={() => setShowBatteryWarningDrawer(false)}
      >
        <Flex alignItems="center" justifyContent="center" px={1}>
          <IconBadge iconColor="primary.c100" iconSize={32} Icon={IconsLegacy.BatteryHalfMedium} />
          <Text fontSize={7} fontWeight="semiBold" textAlign="center" mt={6}>
            {t("FirmwareUpdate.staxBatteryLow")}
          </Text>
          <Text fontSize={4} textAlign="center" color="neutral.c80" mt={6}>
            {t("FirmwareUpdate.staxBatteryLowDescription")}
          </Text>
          <Button
            type="main"
            outline={false}
            onPress={() => setShowBatteryWarningDrawer(false)}
            mt={8}
            alignSelf="stretch"
          >
            {t("common.close")}
          </Button>
        </Flex>
      </QueuedDrawer>
      <QueuedDrawer
        isRequestingToBeOpened={
          batteryStatusesState.error !== null || batteryStatusesState.lockedDevice
        }
        onClose={() => {
          cancelBatteryCheck();
          setDisableUpdateButton(false);
        }}
      >
        {lastConnectedDevice && (
          <Flex alignItems="center" justifyContent="center" px={1}>
            {batteryStatusesState.error?.name === "CantOpenDevice" ||
            batteryStatusesState.lockedDevice ? (
              renderConnectYourDevice({
                t,
                device: lastConnectedDevice,
                theme,
                fullScreen: false,
              })
            ) : (
              <DeviceActionError
                device={lastConnectedDevice}
                t={t}
                errorName={batteryStatusesState.error?.name ?? "BatteryStatusNotRetrieved"}
                translationContext="FirmwareUpdate.batteryStatusErrors"
              />
            )}
          </Flex>
        )}
      </QueuedDrawer>
    </>
  ) : null;
};

export default FirmwareUpdateBanner;
