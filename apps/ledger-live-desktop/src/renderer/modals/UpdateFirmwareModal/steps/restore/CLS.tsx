import React, { useEffect, useState } from "react";
import { StepProps } from "../..";
import CustomImageDeviceAction from "~/renderer/components/CustomImage/CustomImageDeviceAction";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSelector } from "react-redux";
import { reconstructImage } from "~/renderer/components/CustomImage/TestImage";
import { track } from "~/renderer/analytics/segment";

type Props = Partial<StepProps> & { onDone: () => void };
const CLS = ({ onDone, CLSBackup }: Props) => {
  const device = useSelector(getCurrentDevice);
  const [error, setError] = useState<Error | null>(null);

  const onVoid = () => {
    // Stay happy CustomImageDeviceAction.
  };

  useEffect(() => {
    if (!CLSBackup) onDone();
  }, [CLSBackup, onDone]);

  useEffect(() => {
    if (!error) return;
    // Nb Error cases in the recovery flow are acknowledged but still continue
    // the restore flow.
    const timer = setTimeout(() => {
      track("Page Manager CLSRestoreError", {
        error,
      });
      onDone();
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, onDone]);

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
      onError={setError}
      onTryAnotherImage={onVoid}
      blockNavigation={onVoid}
    />
  ) : null;
};

export default CLS;
