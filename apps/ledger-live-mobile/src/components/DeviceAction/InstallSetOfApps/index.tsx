import React, { useCallback, useState, useMemo } from "react";
import { Trans } from "react-i18next";
import { createAction } from "@ledgerhq/live-common/hw/actions/app";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import withRemountableWrapper from "@ledgerhq/live-common/hoc/withRemountableWrapper";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { Flex, Text } from "@ledgerhq/native-ui";
import { getDeviceModel } from "@ledgerhq/devices";

import { DeviceActionDefaultRendering } from "..";
import BottomModal from "../../BottomModal";

import Item from "./Item";
import Confirmation from "./Confirmation";

type Props = {
  dependencies?: string[];
  device: Device;
  onResult: (done: boolean) => void;
  onError?: (error: Error) => void;
};

const action = createAction(connectApp);

/**
 * This component overrides the default rendering for device actions in some
 * cases, falling back to the default one for the rest. Actions such as user blocking
 * requests, errors and such will be rendered in a BottomModal whereas installation
 * progress and loading states will be handled inline as part of the screen where this
 * this is rendered.
 */
const InstallSetOfApps = ({
  dependencies = [],
  device: selectedDevice,
  onResult,
  onError,
  remountMe,
}: Props & { remountMe: () => void }) => {
  const [userConfirmed, setUserConfirmed] = useState(false);
  const productName = getDeviceModel(selectedDevice.modelId).productName;

  const commandRequest = useMemo(
    () => ({
      dependencies: dependencies.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
    }),
    [dependencies],
  );

  const status = action.useHook(
    userConfirmed ? selectedDevice : undefined,
    commandRequest,
  );

  const {
    allowManagerRequestedWording,
    listingApps,
    error,
    currentAppOp,
    itemProgress,
    progress,
    opened,
    installQueue,
  } = status;

  const onWrappedError = useCallback(() => {
    if (error) {
      if (onError) {
        onError(error);
      }
      // We force the component to remount for action.useHook to re-run from
      // scratch and reset the status value
      remountMe();
    }
  }, [remountMe, error, onError]);

  if (opened) {
    onResult(true);
    return null;
  }

  return userConfirmed ? (
    <Flex height="100%">
      <Flex flex={1} alignItems="center" justifyContent="center">
        <Flex mb={2} alignSelf="flex-start">
          <Text mb={5} variant="paragraphLineHeight">
            {listingApps ? (
              <Trans i18nKey="installSetOfApps.ongoing.resolving" />
            ) : typeof progress === "number" && currentAppOp ? (
              <Trans
                i18nKey="installSetOfApps.ongoing.progress"
                values={{ progress: Math.round(progress * 100) }}
              />
            ) : (
              <Trans i18nKey="installSetOfApps.ongoing.loading" />
            )}
          </Text>
          {itemProgress &&
            dependencies?.map((appName, i) => (
              <Item
                key={appName}
                i={i}
                appName={appName}
                isActive={currentAppOp?.name === appName}
                installed={
                  progress ? !installQueue?.includes(appName) : undefined
                }
                itemProgress={itemProgress}
              />
            ))}
        </Flex>
      </Flex>
      <Text textAlign="center" color="neutral.c70">
        <Trans
          i18nKey="installSetOfApps.ongoing.disclaimer"
          values={{ productName }}
        />
      </Text>
      <BottomModal
        isOpened={!!allowManagerRequestedWording || !!error}
        onClose={onWrappedError}
        onModalHide={onWrappedError}
      >
        <Flex alignItems="center">
          <Flex flexDirection="row">
            <DeviceActionDefaultRendering
              status={status}
              device={selectedDevice}
            />
          </Flex>
        </Flex>
      </BottomModal>
    </Flex>
  ) : (
    <Confirmation
      productName={productName}
      onConfirm={() => setUserConfirmed(true)}
      onReject={() => onResult(false)}
    />
  );
};

export default withRemountableWrapper(InstallSetOfApps);
