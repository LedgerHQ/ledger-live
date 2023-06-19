import React, { memo } from "react";
import styled, { css, keyframes } from "styled-components";
import { Trans } from "react-i18next";
import { Transition, TransitionGroup, TransitionStatus } from "react-transition-group";
import { DeviceInfo } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AppsDistribution } from "@ledgerhq/live-common/apps/index";
import { DeviceModel, DeviceModelId } from "@ledgerhq/devices";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { Flex, Text } from "@ledgerhq/react-ui";
import ByteSize from "~/renderer/components/ByteSize";
import { rgba } from "~/renderer/styles/helpers";
import Tooltip from "~/renderer/components/Tooltip";
import Card from "~/renderer/components/Box/Card";
import Box from "~/renderer/components/Box";
import IconTriangleWarning from "~/renderer/icons/TriangleWarning";
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
const Info = styled.div`
  font-family: Inter;
  display: flex;
  margin-bottom: 20px;
  font-size: 13px;
  line-height: 16px;

  & > div {
    display: flex;
    flex-direction: row;
    & > :nth-child(2) {
      margin-left: 10px;
    }
    margin-right: 30px;
  }
`;

const blinkOpacity = keyframes`
	0% {
		opacity: 0.6;
  }
  50% {
		opacity: 1;
	}
	100% {
		opacity: 0.6;
	}
`;

const StorageBarWrapper = styled.div`
  width: 100%;
  border-radius: 3px;
  height: 23px;
  background: ${p => p.theme.colors.palette.text.shade10};
  overflow: hidden;
  position: relative;
`;
const StorageBarGraph = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  position: relative;
  transform-origin: left;
  animation: ${p => p.theme.animations.fadeInGrowX};
`;

const transitionStyles = {
  entering: () => ({
    opacity: 0,
    flexBasis: 0,
    flexGrow: 0,
  }),
  entered: (flexBasis: string) => ({
    opacity: 1,
    flexBasis,
  }),
  exiting: () => ({
    opacity: 0,
    flexBasis: 0,
    flexGrow: 0,
  }),
  exited: () => ({
    opacity: 0,
    flexBasis: 0,
    flexGrow: 0,
  }),
};

/** each device storage bar will grow of 0.5% if the space is available or just fill its given percent basis if the bar is filled */
const StorageBarItem = styled.div.attrs<{
  installing?: boolean;
  state: TransitionStatus;
  ratio: number;
}>(props => ({
  style: {
    backgroundColor: props.installing ? props.theme.colors.palette.text.shade30 : props.color,
    ...transitionStyles[props.state as keyof typeof transitionStyles](
      `${(props.ratio * 1e2).toFixed(3)}%`,
    ),
  },
}))<{ installing?: boolean; state: TransitionStatus; ratio: number }>`
  display: flex;
  flex: 0.005 0 0;
  background-color: black;
  position: relative;
  border-right: 1px solid ${p => p.theme.colors.palette.background.paper};
  box-sizing: border-box;
  transform-origin: left;
  opacity: 1;
  transition: all 0.33s ease-in-out;
  position: relative;
  overflow: hidden;
  ${p =>
    p.installing
      ? css`
          animation: ${blinkOpacity} 2s ease infinite;
        `
      : ""};
  & > * {
    width: 100%;
  }
`;
const FreeInfo = styled.div<{ danger?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  color: ${p => (p.danger ? p.theme.colors.warning : p.theme.colors.palette.text.shade100)};
`;
const TooltipContentWrapper = styled.div`
  & > :nth-child(1) {
    color: ${p => rgba(p.theme.colors.palette.background.paper, 0.7)};
    text-align: center;
    display: block;
  }
  & > :nth-child(2) {
    color: ${p => p.theme.colors.palette.background.paper};
    text-align: center;
  }
`;
const TooltipContent = ({
  name,
  bytes,
  deviceModel,
  deviceInfo,
}: {
  name: string;
  bytes: number;
  deviceModel: DeviceModel;
  deviceInfo: DeviceInfo;
}) => (
  <TooltipContentWrapper>
    <Text>{name}</Text>
    <Text>
      <ByteSize value={bytes} deviceModel={deviceModel} firmwareVersion={deviceInfo.version} />
    </Text>
  </TooltipContentWrapper>
);

// FIXME move to live-common
const appDataColors = {
  Exchange: "#39D2F3",
};
const getAppStorageBarColor = ({
  name,
  currency,
}: {
  currency: CryptoCurrency | undefined | null;
  name: string;
}) => (name in appDataColors ? appDataColors[name as keyof typeof appDataColors] : currency?.color);
export const StorageBar = ({
  deviceInfo,
  distribution,
  deviceModel,
  isIncomplete,
  installQueue,
  uninstallQueue,
}: {
  deviceInfo: DeviceInfo;
  distribution: AppsDistribution;
  deviceModel: DeviceModel;
  isIncomplete: boolean;
  installQueue: string[];
  uninstallQueue: string[];
}) => (
  <StorageBarWrapper>
    {!isIncomplete && (
      <TransitionGroup component={StorageBarGraph}>
        {distribution.apps.map(({ name, currency, bytes, blocks }) => (
          <Transition
            timeout={{
              appear: 333,
              enter: 333,
              exit: 1200,
            }}
            key={`${name}`}
          >
            {state => (
              <StorageBarItem
                state={state}
                installing={installQueue.includes(name) || uninstallQueue.includes(name)}
                color={getAppStorageBarColor({
                  name,
                  currency,
                })}
                ratio={blocks / (distribution.totalBlocks - distribution.osBlocks)}
              >
                <Tooltip
                  hideOnClick={false}
                  content={
                    <TooltipContent
                      name={name}
                      bytes={bytes}
                      deviceModel={deviceModel}
                      deviceInfo={deviceInfo}
                    />
                  }
                />
              </StorageBarItem>
            )}
          </Transition>
        ))}
      </TransitionGroup>
    )}
  </StorageBarWrapper>
);
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
const DeviceStorage = ({
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
  const shouldWarn = distribution.shouldWarnMemory || isIncomplete;
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
            <Info>
              <div>
                <Text variant="h5Inter" fontSize={4} color="neutral.c70">
                  <Trans i18nKey="manager.deviceStorage.used" />
                </Text>
                <Text variant="h5Inter" fontSize={4} color="neutral.c100" fontWeight="semiBold">
                  <ByteSize
                    deviceModel={deviceModel}
                    value={distribution.totalAppsBytes}
                    firmwareVersion={deviceInfo.version}
                  />
                </Text>
              </div>
              <div>
                <Text variant="h5Inter" fontSize={4} color="neutral.c70">
                  <Trans i18nKey="manager.deviceStorage.capacity" />
                </Text>
                <Text variant="h5Inter" fontSize={4} color="neutral.c100" fontWeight="semiBold">
                  <ByteSize
                    deviceModel={deviceModel}
                    value={distribution.appsSpaceBytes}
                    firmwareVersion={deviceInfo.version}
                  />
                </Text>
              </div>
              <div>
                <Text variant="h5Inter" fontSize={4} color="neutral.c70">
                  <Trans i18nKey="manager.deviceStorage.installed" />
                </Text>
                <Text variant="h5Inter" fontSize={4} color="neutral.c100" fontWeight="semiBold">
                  {!isIncomplete ? distribution.apps.length : "—"}
                </Text>
              </div>
              <FreeInfo danger={shouldWarn}>
                {shouldWarn ? <IconTriangleWarning /> : ""}{" "}
                <Box paddingLeft={1}>
                  <Text variant="h5Inter" fontSize={4} color="neutral.c100" fontWeight="semiBold">
                    {isIncomplete ? (
                      <Trans i18nKey="manager.deviceStorage.incomplete" />
                    ) : distribution.freeSpaceBytes > 0 ? (
                      <>
                        <Trans
                          i18nKey="manager.deviceStorage.freeSpace"
                          values={{
                            space: 0,
                          }}
                        >
                          <ByteSize
                            value={distribution.freeSpaceBytes}
                            deviceModel={deviceModel}
                            firmwareVersion={deviceInfo.version}
                          />
                          {"free"}
                        </Trans>
                      </>
                    ) : (
                      <Trans i18nKey="manager.deviceStorage.noFreeSpace" />
                    )}
                  </Text>
                </Box>
              </FreeInfo>
            </Info>
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
                <FeatureToggle feature="customImage">
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
export default memo<Props>(DeviceStorage);
