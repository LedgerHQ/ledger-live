import React, { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Bullet, Column, TrackTutorialProps } from "../shared";
import DeviceAction from "~/renderer/components/DeviceAction";
import { useSelector } from "LLD/hooks/redux";
import { OnboardingContext } from "../../../index";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { Device } from "@ledgerhq/types-devices";
import { useGenuineCheckAction } from "~/renderer/hooks/useConnectAppAction";
import TrackPage from "~/renderer/analytics/TrackPage";

const Success = ({ device, ...trackProps }: { device: Device } & TrackTutorialProps) => {
  const { t } = useTranslation();
  return (
    <Column>
      <TrackPage
        category="Set up device"
        name="Final Step Your device is ready"
        flow={trackProps.flow}
        deviceModelId={trackProps.deviceModelId}
        seedConfiguration={trackProps.seedConfiguration}
      />
      <Bullet
        icon="CheckAlone"
        text={t("onboarding.screens.tutorial.screens.genuineCheck.success.title")}
        subText={t("onboarding.screens.tutorial.screens.genuineCheck.success.desc", {
          deviceName: t(`devices.${device.modelId}`),
        })}
      />
    </Column>
  );
};

type Props = {
  connectedDevice: Device;
  setConnectedDevice: (device: Device | null) => void;
  onGenuineCheckPassed: () => void;
};

export function GenuineCheck({
  connectedDevice,
  setConnectedDevice,
  onGenuineCheckPassed,
  ...trackProps
}: Props & TrackTutorialProps) {
  const { deviceModelId } = useContext(OnboardingContext);
  const device = useSelector(getCurrentDevice);
  const action = useGenuineCheckAction();

  useEffect(() => {
    if (!device) return;
    setConnectedDevice(device);
  }, [device, setConnectedDevice]);

  const [passed, setPassed] = useState<unknown>(null);
  const onResult = useCallback(
    (result: unknown) => {
      setPassed(result);
      onGenuineCheckPassed();
    },
    [onGenuineCheckPassed],
  );

  return passed ? (
    <Success device={connectedDevice} {...trackProps} />
  ) : (
    deviceModelId && (
      <DeviceAction
        overridesPreferredDeviceModel={deviceModelId}
        action={action}
        request={null}
        onResult={onResult}
      />
    )
  );
}

GenuineCheck.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.genuineCheck.buttons.next" />
);
