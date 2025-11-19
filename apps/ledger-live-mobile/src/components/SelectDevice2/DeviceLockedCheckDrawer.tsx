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

type Props = {
  isOpen: boolean;
  device: Device | null;
  onDeviceUnlocked: () => void;
  onClose: () => void;
};

export const DeviceLockedCheckDrawer = ({ isOpen, device, onDeviceUnlocked, onClose }: Props) => {
  const isLockedResult = useIsDeviceLockedPolling({ device, enabled: isOpen });

  const isUndetermined = isLockedResult.type === IsDeviceLockedResultType.undetermined;
  const isLocked = isLockedResult.type === IsDeviceLockedResultType.locked;
  const isUnlocked = isLockedResult.type === IsDeviceLockedResultType.unlocked;
  const isError = isLockedResult.type === IsDeviceLockedResultType.error;
  const lockedStateCannotBeDetermined =
    isLockedResult.type === IsDeviceLockedResultType.lockedStateCannotBeDetermined;

  useEffect(() => {
    if (isUnlocked || lockedStateCannotBeDetermined) {
      onDeviceUnlocked();
      onClose();
    }
  }, [isUnlocked, lockedStateCannotBeDetermined, onDeviceUnlocked, onClose]);

  useTrackDmkErrorsEvents({
    error: isError ? isLockedResult.error : null,
  });

  const trackingProps = device
    ? {
        modelId: device.modelId,
        wired: device.wired,
      }
    : {};

  if (isUnlocked) return null;

  if (!device) return null;

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      {isUndetermined && <InfiniteLoader />}
      {isError && <GenericErrorView error={isLockedResult.error} hasExportLogButton />}
      {isLocked && (
        <>
          <TrackScreen name="Drawer: Unlock your Device" {...trackingProps} />
          <ConnectYourDevice device={device} isLocked fullScreen={false} />
        </>
      )}
    </QueuedDrawer>
  );
};
