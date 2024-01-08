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
import CustomImageManagerButton from "./CustomImageManagerButton";
import DeviceLanguage from "./DeviceLanguage";
import DeviceName from "./DeviceName";
import Certificate from "~/renderer/icons/Certificate";
import { Device } from "@ledgerhq/types-devices";
import { isNavigationLocked } from "~/renderer/reducers/application";
import { useSelector } from "react-redux";
import StorageBar from "./StorageBar";
import StorageInfo from "./StorageInfo";
import { DeviceIllustration } from "./DeviceIllustration";

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
  setPreventResetOnDeviceChange: (value: boolean) => void;
  isIncomplete: boolean;
  installQueue: string[];
  uninstallQueue: string[];
};

/**
 * Component rendering a box containing information about the device
 * and some controls: Device illustration, name and renaming button, storage
 * information etc.
 */
const DeviceInformationSummary = ({
  deviceModel,
  deviceInfo,
  device,
  deviceName,
  distribution,
  onRefreshDeviceInfo,
  setPreventResetOnDeviceChange,
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
                setPreventResetOnDeviceChange={setPreventResetOnDeviceChange}
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
