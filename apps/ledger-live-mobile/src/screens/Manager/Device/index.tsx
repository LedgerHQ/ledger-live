import React, {
  useRef,
  useEffect,
  memo,
  useCallback,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";

import { State, AppsDistribution, Action } from "@ledgerhq/live-common/apps/index";
import { App, DeviceInfo, idsToLanguage } from "@ledgerhq/types-live";

import { Flex, Text, Button, Divider, IconsLegacy } from "@ledgerhq/native-ui";
import styled, { useTheme } from "styled-components/native";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/manager/localization";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { lastSeenCustomImageSelector } from "~/reducers/settings";
import DeviceAppStorage from "./DeviceAppStorage";

import NanoS from "~/images/devices/NanoS";
import Stax from "~/images/devices/Stax";
import NanoX from "~/images/devices/NanoX";

import DeviceName from "./DeviceName";
import InstalledAppsModal from "../Modals/InstalledAppsModal";

import DeviceLanguage from "./DeviceLanguage";
import CustomLockScreen from "./CustomLockScreen";

const illustrations = {
  nanoS: NanoS,
  nanoSP: NanoS,
  nanoX: NanoX,
  blue: NanoS,
  stax: Stax,
};

type Props = PropsWithChildren<{
  distribution: AppsDistribution;
  state: State;
  result: ListAppsResult;
  deviceId: string;
  initialDeviceName?: string | null;
  pendingInstalls: boolean;
  deviceInfo: DeviceInfo;
  device: Device;
  dispatch: (action: Action) => void;
  appList: App[];
  onLanguageChange: () => void;
}>;

const BorderCard = styled.View`
  flex-direction: column;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 8px;
`;

const DeviceCard = ({
  distribution,
  state,
  device,
  initialDeviceName,
  pendingInstalls,
  deviceInfo,
  dispatch,
  appList,
  onLanguageChange,
  children,
}: Props) => {
  const { colors, theme } = useTheme();
  const lastSeenCustomImage = useSelector(lastSeenCustomImageSelector);
  const isFirstCustomImageUpdate = useRef<boolean>(true);

  const { deviceModel } = state;
  const [appsModalOpen, setAppsModalOpen] = useState(false);

  const [illustration] = useState(
    illustrations[deviceModel.id]({ color: colors.neutral.c100, theme }),
  );

  useEffect(() => {
    if (isFirstCustomImageUpdate.current) {
      isFirstCustomImageUpdate.current = false;
    } else {
      dispatch({ type: "setCustomImage", lastSeenCustomImage });
    }
  }, [dispatch, lastSeenCustomImage]);

  const openAppsModal = useCallback(() => {
    setAppsModalOpen(true);
  }, [setAppsModalOpen]);

  const closeAppsModal = useCallback(() => {
    setAppsModalOpen(false);
  }, [setAppsModalOpen]);

  const isLocalizationSupported = useMemo<boolean>(
    () =>
      deviceInfo.seVersion
        ? isDeviceLocalizationSupported(deviceInfo.seVersion, deviceModel.id)
        : false,
    [deviceInfo.seVersion, deviceModel.id],
  );

  const showDeviceLanguage = isLocalizationSupported && deviceInfo.languageId !== undefined;

  const hasCustomImage =
    useFeature("customImage")?.enabled && deviceModel.id === DeviceModelId.stax;

  const disableFlows = pendingInstalls;

  return (
    <BorderCard>
      {children}
      <Flex flexDirection={"row"} mt={20} mx={4} mb={8} alignItems="center">
        {illustration}
        <Flex
          flex={1}
          flexDirection={"column"}
          alignItems={"flex-start"}
          justifyContent="center"
          ml={4}
        >
          <DeviceName
            device={device}
            deviceInfo={deviceInfo}
            initialDeviceName={initialDeviceName}
            disabled={disableFlows}
          />
          <Flex backgroundColor={"neutral.c30"} py={1} px={3} borderRadius={4} my={2}>
            <Text variant={"subtitle"} fontWeight={"semiBold"} color={"neutral.c80"}>
              <Trans
                i18nKey="FirmwareVersionRow.subtitle"
                values={{ version: deviceInfo.version }}
              />
            </Text>
          </Flex>
          <Flex flexDirection={"row"} alignItems={"center"} mt={2} mb={3}>
            <IconsLegacy.CircledCheckSolidMedium size={18} color={"palette.success.c50"} />
            <Text
              variant={"body"}
              fontWeight={"medium"}
              color={"palette.neutral.c80"}
              numberOfLines={1}
              ml={2}
            >
              <Trans i18nKey="DeviceItemSummary.genuine" />
            </Text>
          </Flex>
        </Flex>
      </Flex>
      {hasCustomImage || showDeviceLanguage ? (
        <>
          <Flex px={6}>
            {hasCustomImage && <CustomLockScreen disabled={disableFlows} device={device} />}
            {showDeviceLanguage && (
              <Flex mt={hasCustomImage ? 6 : 0}>
                <DeviceLanguage
                  disabled={disableFlows}
                  currentDeviceLanguage={
                    idsToLanguage[deviceInfo.languageId as keyof typeof idsToLanguage]
                  }
                  deviceInfo={deviceInfo}
                  device={device}
                  onLanguageChange={onLanguageChange}
                />
              </Flex>
            )}
          </Flex>
          <Flex p={6}>
            <Divider />
          </Flex>
        </>
      ) : null}
      <DeviceAppStorage
        distribution={distribution}
        deviceModel={deviceModel}
        installQueue={state.installQueue}
        uninstallQueue={state.uninstallQueue}
        deviceInfo={deviceInfo}
      />

      {appList.length > 0 && (
        <Flex mx={6} mb={6}>
          <Button size="small" type="color" onPress={openAppsModal}>
            <Trans i18nKey="manager.myApps" />
          </Button>
        </Flex>
      )}

      <InstalledAppsModal
        isOpen={appsModalOpen}
        onClose={closeAppsModal}
        state={state}
        dispatch={dispatch}
        appList={appList}
        illustration={illustration}
        deviceInfo={deviceInfo}
      />
    </BorderCard>
  );
};

export default memo(DeviceCard);
