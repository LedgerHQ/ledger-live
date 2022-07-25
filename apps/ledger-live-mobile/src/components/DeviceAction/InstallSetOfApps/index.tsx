import React, { useCallback, useState, useMemo } from "react";
import { Trans } from "react-i18next";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/app";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import connectApp from "@ledgerhq/live-common/lib/hw/connectApp";
import { Flex, ProgressLoader, Text } from "@ledgerhq/native-ui";
import { getDeviceModel } from "@ledgerhq/devices";

import { DeviceActionDefaultRendering } from "..";
import BottomModal from "../../BottomModal";

import Items from "./Items";
import Confirmation from "./Confirmation";
import WrappedOverriddenUI from "./WrappedOverriddenUI";

type Props = {
  dependencies?: string[];
  device: Device;
  onResult: (done: boolean) => void;
  onError: (error: Error) => void;
};

const action = createAction(connectApp);

const InstallSetOfApps = ({
  dependencies = [],
  device: selectedDevice,
  onResult,
  onError,
}: Props) => {
  const [installing, setInstalling] = useState(false);
  const productName = getDeviceModel(selectedDevice.modelId).productName;

  const commandRequest = useMemo(
    () => ({
      dependencies: dependencies.map(appName => ({ appName })),
      appName: "BOLOS",
      withInlineInstallProgress: true,
    }),
    [dependencies],
  );

  const status: any = action.useHook(
    installing ? selectedDevice : undefined,
    commandRequest,
  );

  const {
    allowManagerRequestedWording,
    listingApps,
    unresponsive,
    error,
    isLoading,
    currentAppOp,
    itemProgress,
    progress,
    opened,
    device,
    installQueue,
  } = status;

  const onWrappedError = useCallback(() => {
    if (onError) {
      onError(error);
    }
  }, [error, onError]);

  if (!installing) {
    return (
      <Confirmation
        productName={productName}
        onConfirm={() => setInstalling(true)}
        onReject={() => onResult(false)}
      />
    );
  }

  if (opened) {
    onResult(true);
    return null;
  }

  if (listingApps) {
    return (
      <WrappedOverriddenUI productName={productName}>
        <Text variant="bodyLineHeight">
          <Trans i18nKey="installSetOfApps.ongoing.resolving" />
        </Text>
      </WrappedOverriddenUI>
    );
  }

  if (
    !error &&
    !allowManagerRequestedWording &&
    (isLoading || (!isLoading && !device) || unresponsive || !currentAppOp)
  ) {
    return (
      <WrappedOverriddenUI productName={productName}>
        <Flex flexDirection="column">
          <Text mb={3} variant="bodyLineHeight">
            <Trans i18nKey="installSetOfApps.ongoing.loading" />
          </Text>
          <ProgressLoader infinite radius={20} />
        </Flex>
      </WrappedOverriddenUI>
    );
  }

  if (currentAppOp) {
    return (
      <WrappedOverriddenUI productName={productName}>
        <Items
          dependencies={dependencies}
          installQueue={installQueue}
          progress={progress}
          itemProgress={itemProgress}
          currentAppOp={currentAppOp}
        />
      </WrappedOverriddenUI>
    );
  }

  // Fallback for non-overridden UI cases using the default UI
  return (
    <BottomModal
      id="DeviceActionModal"
      isOpened
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
  );
};

export default InstallSetOfApps;
