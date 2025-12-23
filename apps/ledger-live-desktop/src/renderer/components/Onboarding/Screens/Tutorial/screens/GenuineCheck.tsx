import React, { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { AsideFooter, Bullet, Column, IllustrationContainer } from "../shared";
import connectNano from "../assets/connectNano.png";
import DeviceAction from "~/renderer/components/DeviceAction";
import { useSelector } from "LLD/hooks/redux";
import { OnboardingContext } from "../../../index";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { Device } from "@ledgerhq/types-devices";
import { useConnectManagerAction } from "~/renderer/hooks/useConnectAppAction";
import TrackPage from "~/renderer/analytics/TrackPage";

const Success = ({ device }: { device: Device }) => {
  const { t } = useTranslation();
  return (
    <Column>
      <TrackPage category="Set up device" name="Final Step Your device is ready" />
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
};

export function GenuineCheck({ connectedDevice, setConnectedDevice }: Props) {
  const { deviceModelId } = useContext(OnboardingContext);
  const device = useSelector(getCurrentDevice);
  const action = useConnectManagerAction();

  useEffect(() => {
    if (!device) return;
    setConnectedDevice(device);
  }, [device, setConnectedDevice]);

  const [passed, setPassed] = useState<unknown>(null);
  const onResult = useCallback((result: unknown) => {
    setPassed(result);
  }, []);

  return passed ? (
    <Success device={connectedDevice} />
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

GenuineCheck.Illustration = (
  <IllustrationContainer width="240px" height="245px" src={connectNano} />
);

const Footer = (props: object) => {
  const { t } = useTranslation();
  return (
    <AsideFooter
      {...props}
      text={t("onboarding.screens.tutorial.screens.recoveryHowTo.help.descr")}
    />
  );
};

GenuineCheck.Footer = Footer;

GenuineCheck.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.genuineCheck.buttons.next" />
);
