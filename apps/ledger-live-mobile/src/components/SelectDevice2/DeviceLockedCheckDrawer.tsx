import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { InfiniteLoader } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { TrackScreen } from "~/analytics";
import { useTrackDmkErrorsEvents } from "~/analytics/hooks/useTrackDmkErrorsEvents";
import GenericErrorView from "~/components/GenericErrorView";
import { ConnectYourDevice } from "../DeviceAction/rendering";
import QueuedDrawer from "../QueuedDrawer";
import { useIsDeviceLockedPolling } from "~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling";
import { IsDeviceLockedResultType } from "~/hooks/useIsDeviceLockedPolling/types";
import { PeerRemovedPairing } from "@ledgerhq/errors";
import { BleForgetDeviceIllustration } from "../BleDevicePairingFlow/BleDevicePairingContent/BleForgetDeviceIllustration";
import { getDeviceModel } from "@ledgerhq/devices";

type Props = {
  isOpen: boolean;
  device: Device | null;
  onDeviceUnlocked: () => void;
  onClose: () => void;
};

export const DeviceLockedCheckDrawer = ({ isOpen, device, onDeviceUnlocked, onClose }: Props) => {
  const { result: isLockedResult, retry } = useIsDeviceLockedPolling({ device, enabled: isOpen });

  const isUndetermined = isLockedResult.type === IsDeviceLockedResultType.undetermined;
  const isLocked = isLockedResult.type === IsDeviceLockedResultType.locked;
  const isUnlocked = isLockedResult.type === IsDeviceLockedResultType.unlocked;
  const isError = isLockedResult.type === IsDeviceLockedResultType.error;
  const isLockedStateCannotBeDetermined =
    isLockedResult.type === IsDeviceLockedResultType.lockedStateCannotBeDetermined;
  const isPeerRemovedPairingError = isError && isLockedResult.error instanceof PeerRemovedPairing;

  useEffect(() => {
    if (isUnlocked || isLockedStateCannotBeDetermined) {
      onDeviceUnlocked();
      onClose();
    }
  }, [isUnlocked, isLockedStateCannotBeDetermined, onDeviceUnlocked, onClose]);

  useTrackDmkErrorsEvents({
    error: isError ? isLockedResult.error : null,
  });

  const trackingProps = device
    ? {
        modelId: device.modelId,
        wired: device.wired,
      }
    : {};

  if (isUnlocked || !device) return null;

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      {isUndetermined && <InfiniteLoader />}
      {isError &&
        (isPeerRemovedPairingError ? (
          <BleForgetDeviceIllustration
            productName={getDeviceModel(device.modelId).productName}
            onRetry={retry}
          />
        ) : (
          <GenericErrorView error={isLockedResult.error} hasExportLogButton />
        ))}
      {isLocked && (
        <>
          <TrackScreen name="Drawer: Unlock your Device" {...trackingProps} />
          <ConnectYourDevice device={device} isLocked fullScreen={false} />
        </>
      )}
    </QueuedDrawer>
  );
};
