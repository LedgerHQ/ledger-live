import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { UploadCustomLockScreenDeviceAction } from "@ledgerhq/dmk-ledger-wallet";
import { useExecuteDeviceActionWithDevice } from "@ledgerhq/live-common/device/hooks/useExecuteDeviceActionWithDevice";
import { ComponentProps, useMemo } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Image } from "react-native";

type Props = {
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
  hexImage: string;
  source?: ComponentProps<typeof Image>["source"];
  referral?: string;
  onStart?: () => void;
  onResult?: ({ imageHash, imageSize }: { imageHash: string; imageSize: number }) => void;
  onSkip?: () => void;
};

const analyticsScreenNameRefusedOnStax = "Lock screen cancelled on device";
const analyticsRefusedOnStaxUploadAnotherEventProps = {
  button: "Upload another image",
};
const analyticsRefusedOnStaxDoThisLaterEventProps = {
  button: "Do this later",
};
const analyticsErrorTryAgainEventProps = {
  button: "Try again",
};

export const UploadCustomLockScreen: React.FC<Props> = ({
  device,
  deviceModelId,
  hexImage,
  source,
  referral,
  onStart,
  onResult,
  onSkip,
}: Props) => {
  const deviceAction = useMemo(
    () =>
      new UploadCustomLockScreenDeviceAction({
        input: {
          imageData: new Uint8Array(Buffer.from(hexImage, "hex")),
          unlockTimeout: 60_000, // 1 minute
        },
      }),
    [hexImage],
  );

  const { state, error, restart } = useExecuteDeviceActionWithDevice({
    deviceAction,
    deviceId: device.deviceId,
    enabled: true,
  });

  // TODO: tracking
  // useUploadCLSTracking(state)

  // TODO: error tracking
  // useTrackDmkErrorsEvents(error)

  // TODO:
  //    derive refusedOnDevice from error

  // TODO: pass retry callback to the component,
  //   if refusedOnDevice, openModal function -> opens the CustomImageBottomModal to choose new image
  //   else calls restart()

  // TODO: handle result:
  //   dispatch setLastSeenCustomImage action
  //   call onResult callback

  // TODO: handle refusedOnDevice:
  //   dispatch clearLastSeenCustomImage action

  return <UploadCLS deviceActionState={state} />;
};
