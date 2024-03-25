import React, { useEffect } from "react";
import { getScreenDataDimensions } from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { StepProps } from "../../types";
import CustomLockScreenDeviceAction from "~/renderer/components/CustomImage/CustomLockScreenDeviceAction";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSelector } from "react-redux";
import { reconstructImage } from "~/renderer/components/CustomImage/TestImage";
import TrackPage from "~/renderer/analytics/TrackPage";

type Props = Partial<StepProps> & {
  onDone: () => void;
  setError: (arg0: Error) => void;
  deviceModelId: CLSSupportedDeviceModelId;
};
const CustomLockScreen = ({ onDone, setError, CLSBackup, deviceModelId }: Props) => {
  const device = useSelector(getCurrentDevice);

  const onVoid = () => {
    // Stay happy CustomImageDeviceAction.
  };

  useEffect(() => {
    if (!CLSBackup) onDone();
  }, [CLSBackup, onDone]);

  return CLSBackup ? (
    <>
      <CustomLockScreenDeviceAction
        restore
        deviceModelId={deviceModelId}
        device={device}
        hexImage={CLSBackup}
        inlineRetry={false}
        source={
          reconstructImage({ hexData: CLSBackup, ...getScreenDataDimensions(deviceModelId) })
            .imageBase64DataUri
        }
        padImage={false}
        onResult={onDone}
        onSkip={onDone}
        onError={setError}
        onTryAnotherImage={onVoid}
        blockNavigation={onVoid}
      />
      <TrackPage category="Allow lock screen picture restoration on the device" />
    </>
  ) : null;
};

export default CustomLockScreen;
