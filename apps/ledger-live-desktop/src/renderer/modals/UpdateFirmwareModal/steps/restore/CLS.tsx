import React, { useEffect } from "react";
import { StepProps } from "../..";
import CustomImageDeviceAction from "~/renderer/components/CustomImage/CustomImageDeviceAction";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSelector } from "react-redux";
import { reconstructImage } from "~/renderer/components/CustomImage/TestImage";
import { track } from "~/renderer/analytics/segment";

type Props = Partial<StepProps> & { onDone: () => void };
const CLS = ({ onDone, CLSBackup }: Props) => {
  const device = useSelector(getCurrentDevice);
  const onVoid = () => {
    // Stay happy CustomImageDeviceAction.
  };

  useEffect(() => {
    if (!CLSBackup) onDone();
  }, [CLSBackup, onDone]);

  return CLSBackup ? (
    <CustomImageDeviceAction
      restore
      device={device}
      hexImage={CLSBackup}
      inlineRetry={false}
      source={reconstructImage({ hexData: CLSBackup, width: 400, height: 672 }).imageBase64DataUri}
      padImage={false}
      onResult={onDone}
      onSkip={onDone}
      onError={(error: Error) => {
        track("Page Manager CLSRestoreError", {
          error,
        });
        setTimeout(onDone, 3000); // Nb Maybe something cleaner?
      }}
      onTryAnotherImage={onVoid}
      blockNavigation={onVoid}
    />
  ) : null;
};

export default CLS;
