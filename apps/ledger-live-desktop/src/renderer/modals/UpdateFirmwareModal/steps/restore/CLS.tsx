import React, { useEffect } from "react";
import { StepProps } from "../..";
import CustomImageDeviceAction from "~/renderer/components/CustomImage/CustomImageDeviceAction";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSelector } from "react-redux";
import { reconstructImage } from "~/renderer/components/CustomImage/TestImage";
import TrackPage from "~/renderer/analytics/TrackPage";

type Props = Partial<StepProps> & { onDone: () => void; setError: (arg0: Error) => void };
const CLS = ({ onDone, setError, CLSBackup }: Props) => {
  const device = useSelector(getCurrentDevice);

  const onVoid = () => {
    // Stay happy CustomImageDeviceAction.
  };

  useEffect(() => {
    if (!CLSBackup) onDone();
  }, [CLSBackup, onDone]);

  return CLSBackup ? (
    <>
      <CustomImageDeviceAction
        restore
        device={device}
        hexImage={CLSBackup}
        inlineRetry={false}
        source={
          reconstructImage({ hexData: CLSBackup, width: 400, height: 672 }).imageBase64DataUri
        }
        padImage={false}
        onResult={onDone}
        onSkip={onDone}
        onError={setError}
        onTryAnotherImage={onVoid}
        blockNavigation={onVoid}
      />
      <TrackPage category="Allow lock screen picture restoration on Ledger Stax" />
    </>
  ) : null;
};

export default CLS;
