import React, { useState, useCallback, useEffect } from "react";
import { Platform, Linking } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Alert, Text, Flex, IconsLegacy, IconBadge } from "@ledgerhq/native-ui";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StackNavigationProp } from "@react-navigation/stack";
import getBatteryStatus, { BatteryStatusTypes } from "@ledgerhq/live-common/hw/getBatteryStatus";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from } from "rxjs";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import useLatestFirmware from "@ledgerhq/live-common/hooks/useLatestFirmware";
import { log } from "@ledgerhq/logs";
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

type FirmwareUpdateBannerProps = {
  onBackFromUpdate?: () => void;
};

const FirmwareUpdateBanner = ({ onBackFromUpdate }: FirmwareUpdateBannerProps) => {
  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(lastSeenDeviceSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(hasCompletedOnboardingSelector);

  const [disableUpdateButton, setDisableUpdateButton] = useState(false);
  const [staxUpdateTriggerNonce, setStaxUpdateTriggerNonce] = useState(0);
  const [showBatteryWarningDrawer, setShowBatteryWarningDrawer] = useState<boolean>(false);

  const [showUnsupportedUpdateDrawer, setShowUnsupportedUpdateDrawer] = useState<boolean>(false);

  const { t } = useTranslation();

  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();

  const newFwUpdateUxFeatureFlag = useFeature("llmNewFirmwareUpdateUx");

  const latestFirmware = useLatestFirmware(lastSeenDevice?.deviceInfo);

  const onExperimentalFirmwareUpdate = useCallback(() => {
    if (newFwUpdateUxFeatureFlag?.enabled) {
      navigation.navigate(NavigatorName.Manager, {
        screen: ScreenName.FirmwareUpdate,
        params: {
          device: lastConnectedDevice,
          deviceInfo: lastSeenDevice?.deviceInfo,
          firmwareUpdateContext: latestFirmware,
          onBackFromUpdate,
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
    onBackFromUpdate,
  ]);

  // Effect that will check the battery of stax before triggering the update and display a warning preventing the update
  // in case the battery is too low and the device is not charging
  useEffect(() => {
    if (staxUpdateTriggerNonce > 0 && lastConnectedDevice) {
      setDisableUpdateButton(true);
      const sub = withDevice(lastConnectedDevice.deviceId)(transport =>
        from(
          getBatteryStatus(transport, [
            BatteryStatusTypes.BATTERY_PERCENTAGE,
            BatteryStatusTypes.BATTERY_FLAGS,
          ] as const),
        ),
      ).subscribe({
        next: ([percentage, statusFlags]) => {
          percentage < 20 && statusFlags.charging === 0
            ? setShowBatteryWarningDrawer(true)
            : onExperimentalFirmwareUpdate();
          setDisableUpdateButton(false);
        },
        error: err => {
          log("FirmwareUpdateBanner", "Unable to retrieve Stax's battery", err);
          setShowBatteryWarningDrawer(true);
          setDisableUpdateButton(false);
        },
      });

      return () => {
        setDisableUpdateButton(false);
        sub.unsubscribe();
      };
    }

    return undefined;
  }, [lastConnectedDevice, onExperimentalFirmwareUpdate, staxUpdateTriggerNonce]);

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
      setStaxUpdateTriggerNonce(staxUpdateTriggerNonce + 1);
    }
    // Path with any device model, wired and on android
    else if (isUsbFwVersionUpdateSupported && wiredDevice && Platform.OS === "android") {
      onExperimentalFirmwareUpdate();
    } else {
      setShowUnsupportedUpdateDrawer(true);
    }
  }, [
    isUsbFwVersionUpdateSupported,
    newFwUpdateUxFeatureFlag?.enabled,
    lastConnectedDevice?.modelId,
    staxUpdateTriggerNonce,
    onExperimentalFirmwareUpdate,
    wiredDevice,
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
                title={t("FirmwareUpdate.update")}
                onPress={onClickUpdate}
                outline={false}
              />
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
    </>
  ) : null;
};

export default FirmwareUpdateBanner;
