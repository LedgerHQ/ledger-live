import React from "react";
import { Transition, TransitionGroup } from "react-transition-group";
import { DeviceInfo } from "@ledgerhq/types-live";
import { AppsDistribution } from "@ledgerhq/live-common/apps/index";
import { DeviceModel } from "@ledgerhq/devices";
import ByteSize from "~/renderer/components/ByteSize";
import { Text } from "@ledgerhq/react-ui";
import styled, { css, keyframes } from "styled-components";
import { TransitionStatus } from "react-transition-group";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { rgba } from "~/renderer/styles/helpers";
import Tooltip from "~/renderer/components/Tooltip";

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

/**
 * Component rendering a bar that graphically displays the distribution of
 * installed apps and their storage usage.
 */
const StorageBar = ({
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

export default StorageBar;
