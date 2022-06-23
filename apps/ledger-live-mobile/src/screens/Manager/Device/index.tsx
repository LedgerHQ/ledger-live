import React, { memo, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { Trans } from "react-i18next";

import { State, AppsDistribution } from "@ledgerhq/live-common/apps/index";
import { App, DeviceInfo } from "@ledgerhq/live-common/types/manager";

import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { CircledCheckMedium } from "@ledgerhq/native-ui/assets/icons";
import styled, { useTheme } from "styled-components/native";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/manager/localization";
import { idsToLanguage } from "@ledgerhq/live-common/types/languages";
import DeviceAppStorage from "./DeviceAppStorage";

import NanoS from "../../../images/devices/NanoS";
import NanoX from "../../../images/devices/NanoX";

import DeviceName from "./DeviceName";
import InstalledAppsModal from "../Modals/InstalledAppsModal";
import Divider from "../../../components/Divider";
import DeviceLanguage from "./DeviceLanguage";

const illustrations = {
  nanoS: NanoS,
  nanoSP: NanoS,
  nanoX: NanoX,
  blue: NanoS,
  nanoFTS: p => (
    <View style={{ borderWidth: 1, borderColor: "red" }}>
      <NanoS {...p} />
    </View>
  ),
};

type Props = {
  distribution: AppsDistribution;
  state: State;
  result: ListAppsResult;
  deviceId: string;
  initialDeviceName: string;
  blockNavigation: boolean;
  deviceInfo: DeviceInfo;
  setAppUninstallWithDependencies: (params: {
    dependents: App[];
    app: App;
  }) => void;
  dispatch: (action: any) => void;
  appList: App[];
};

const BorderCard = styled.View`
  flex-direction: column;
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
`;

const VersionContainer = styled(Flex).attrs({
  borderRadius: 4,
  paddingHorizontal: 8,
  paddingVertical: 5.5,
})``;

const DeviceCard = ({
  distribution,
  state,
  deviceId,
  initialDeviceName,
  blockNavigation,
  deviceInfo,
  setAppUninstallWithDependencies,
  dispatch,
  appList,
}: Props) => {
  const { colors } = useTheme();
  const { deviceModel } = state;
  const [appsModalOpen, setAppsModalOpen] = useState(false);

  const [illustration] = useState(
    illustrations[deviceModel.id]({ color: colors.neutral.c100 }),
  );

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

  return (
    <BorderCard>
      <Flex flexDirection={"row"} mt={24} mx={4} mb={8}>
        {illustration}
        <Flex
          flex={1}
          flexDirection={"column"}
          alignItems={"flex-start"}
          ml={4}
        >
          <DeviceName
            deviceId={deviceId}
            deviceModel={deviceModel}
            initialDeviceName={initialDeviceName}
            disabled={blockNavigation}
          />
          <Flex flexDirection={"row"} alignItems={"center"} mt={2} mb={3}>
            <Text
              variant={"body"}
              fontWeight={"medium"}
              color={"palette.neutral.c80"}
              numberOfLines={1}
              mr={3}
            >
              <Trans i18nKey="DeviceItemSummary.genuine" />
            </Text>
            <CircledCheckMedium size={18} color={"palette.success.c80"} />
          </Flex>
          <VersionContainer backgroundColor={"neutral.c80"}>
            <Text
              variant={"subtitle"}
              fontWeight={"semiBold"}
              color={"neutral.c20"}
            >
              <Trans
                i18nKey="FirmwareVersionRow.subtitle"
                values={{ version: deviceInfo.version }}
              />
            </Text>
          </VersionContainer>
        </Flex>
      </Flex>
      {isLocalizationSupported && deviceInfo.languageId !== undefined && (
        <Flex px={6}>
          <Divider />
          <DeviceLanguage language={idsToLanguage[deviceInfo.languageId]} />
          <Divider />
        </Flex>
      )}
      <DeviceAppStorage
        distribution={distribution}
        deviceModel={deviceModel}
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
        setAppUninstallWithDependencies={setAppUninstallWithDependencies}
        illustration={illustration}
        deviceInfo={deviceInfo}
      />
    </BorderCard>
  );
};

export default memo(DeviceCard);
