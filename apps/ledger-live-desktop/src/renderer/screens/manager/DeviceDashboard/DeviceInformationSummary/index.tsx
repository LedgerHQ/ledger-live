import React, { memo } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { DeviceInfo } from "@ledgerhq/types-live";
import { AppsDistribution } from "@ledgerhq/live-common/apps/index";
import { DeviceModel, DeviceModelId } from "@ledgerhq/devices";
import { FeatureToggle } from "@ledgerhq/live-config/featureFlags/index";
import { Flex, Text } from "@ledgerhq/react-ui";
import Card from "~/renderer/components/Box/Card";
import Box from "~/renderer/components/Box";
import nanoS from "~/renderer/images/devices/nanoS.png";
import nanoSDark from "~/renderer/images/devices/nanoS_dark.png";
import nanoSP from "~/renderer/images/devices/nanoSP.png";
import nanoSPDark from "~/renderer/images/devices/nanoSP_dark.png";
import nanoX from "~/renderer/images/devices/nanoX.png";
import nanoXDark from "~/renderer/images/devices/nanoX_dark.png";
import stax from "~/renderer/images/devices/stax.png";
import staxDark from "~/renderer/images/devices/stax_dark.png";
import blue from "~/renderer/images/devices/blue.png";
import CustomImageManagerButton from "./CustomImageManagerButton";
import DeviceLanguage from "./DeviceLanguage";
import DeviceName from "./DeviceName";
import Certificate from "~/renderer/icons/Certificate";
import { Device } from "@ledgerhq/types-devices";
import { isNavigationLocked } from "~/renderer/reducers/application";
import { useSelector } from "react-redux";
import { StorageBar } from "./StorageBar";
import StorageInfo from "./StorageInfo";

const illustrations = {
  nanoS: {
    light: nanoS,
    dark: nanoSDark,
  },
  nanoSP: {
    light: nanoSP,
    dark: nanoSPDark,
  },
  nanoX: {
    light: nanoX,
    dark: nanoXDark,
  },
  stax: {
    light: stax,
    dark: staxDark,
  },
  blue: {
    light: blue,
    dark: blue,
  },
};

export const DeviceIllustration = styled.img.attrs<{
  deviceModel: DeviceModel;
}>(p => ({
  src: illustrations[
    (process.env.OVERRIDE_MODEL_ID || p.deviceModel.id) as keyof typeof illustrations
  ][p.theme.colors.palette.type || "light"],
}))<{
  deviceModel: DeviceModel;
}>`
  position: absolute;
  top: 0;
  left: 50%;
  max-height: 100%;
  filter: drop-shadow(0px 5px 7px ${p => p.theme.colors.palette.text.shade10});
  transform: translateX(-50%);
  user-select: none;
  pointer-events: none;
`;
const Separator = styled.div`
  height: 1px;
  margin: 20px 0px;
  background: ${p => p.theme.colors.neutral.c40};
  width: 100%;
`;

const VerticalSeparator = styled.div`
  height: 18px;
  background: ${p => p.theme.colors.neutral.c40};
  width: 1px;
  margin: 1px 24px 0px 24px;
`;
const HighlightVersion = styled.span`
  padding: 4px 6px;
  color: ${p => p.theme.colors.neutral.c100};
  position: relative;
  &:before {
    content: " ";
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.1;
    background: ${p => p.theme.colors.neutral.c100};
    border-radius: 4px;
  }
`;

type Props = {
  deviceModel: DeviceModel;
  deviceInfo: DeviceInfo & { languageId: number };
  deviceName: string;
  device: Device;
  distribution: AppsDistribution;
  onRefreshDeviceInfo: () => void;
  isIncomplete: boolean;
  installQueue: string[];
  uninstallQueue: string[];
};

const DeviceInformationSummary = ({
  deviceModel,
  deviceInfo,
  device,
  deviceName,
  distribution,
  onRefreshDeviceInfo,
  isIncomplete,
  installQueue,
  uninstallQueue,
}: Props) => {
  const navigationLocked = useSelector(isNavigationLocked);

  return (
    <Card p={20} mb={4} data-test-id="device-storage-card">
      <Flex flexDirection="row">
        <Box position="relative" flex="0 0 140px" mr={20}>
          <DeviceIllustration deviceModel={deviceModel} />
        </Box>
        <Flex flexDirection="column" flex={1}>
          <div
            style={{
              flex: 1,
            }}
          >
            <Box horizontal alignItems="center">
              <DeviceName
                deviceName={deviceName}
                deviceInfo={deviceInfo}
                device={device}
                onRefreshDeviceInfo={onRefreshDeviceInfo}
                disabled={navigationLocked}
              />
            </Box>
            <Flex justifyContent="space-between" alignItems="center" mt={1}>
              <Flex flexDirection="row" alignItems="center">
                <Text variant="h5Inter" fontSize={4} color="neutral.c70">
                  {
                    <Trans
                      i18nKey="manager.deviceStorage.OSVersion"
                      values={{
                        version: deviceInfo.version,
                      }}
                    />
                  }{" "}
                  {<HighlightVersion>{deviceInfo.version}</HighlightVersion>}
                </Text>
                <Flex ml={2} flexDirection="row" justifyItems="center" alignItems="center">
                  <Certificate />
                  <Text variant="h5Inter" fontSize={4} color="neutral.c70" ml={1}>
                    <Trans i18nKey="manager.deviceStorage.genuine" />
                  </Text>
                </Flex>
              </Flex>
            </Flex>
            <Separator />
            <StorageInfo
              distribution={distribution}
              deviceInfo={deviceInfo}
              deviceModel={deviceModel}
              isIncomplete={isIncomplete}
            />
            <StorageBar
              distribution={distribution}
              deviceInfo={deviceInfo}
              deviceModel={deviceModel}
              isIncomplete={isIncomplete}
              installQueue={installQueue}
              uninstallQueue={uninstallQueue}
            />
          </div>
          <Flex
            data-test-id="device-options-container"
            alignSelf="flex-start"
            justifyContent="flex-start"
            alignItems="flex-end"
            rowGap={3}
            mt={4}
          >
            {deviceInfo.languageId !== undefined && (
              <DeviceLanguage
                deviceInfo={deviceInfo}
                device={device}
                disabled={navigationLocked}
                onRefreshDeviceInfo={onRefreshDeviceInfo}
              />
            )}

            {deviceModel.id === DeviceModelId.stax ? (
              <>
                {deviceInfo.languageId !== undefined && <VerticalSeparator />}
                <FeatureToggle featureId="customImage">
                  <CustomImageManagerButton disabled={navigationLocked} />
                </FeatureToggle>
              </>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};
export default memo<Props>(DeviceInformationSummary);
