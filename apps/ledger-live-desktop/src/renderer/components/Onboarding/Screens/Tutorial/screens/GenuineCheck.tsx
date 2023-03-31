import React, { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { AsideFooter, Bullet, Column, IllustrationContainer } from "../shared";
import connectNano from "../assets/connectNano.png";
import connectManager from "@ledgerhq/live-common/hw/connectManager";

import { createAction } from "@ledgerhq/live-common/hw/actions/manager";
import { getEnv } from "@ledgerhq/live-common/env";
import DeviceAction from "~/renderer/components/DeviceAction";

import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { useSelector } from "react-redux";
import { OnboardingContext } from "../../../index";
import { getCurrentDevice } from "~/renderer/reducers/devices";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectManager);

const Success = ({ device }: { device: Device }) => {
  const { t } = useTranslation();
  return (
    <Column>
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
  connectedDevice: unknown;
  setConnectedDevice: (device: unknown) => void;
};

export function GenuineCheck({ connectedDevice, setConnectedDevice }: Props) {
  const { deviceModelId } = useContext(OnboardingContext);
  const device = useSelector(getCurrentDevice);

  useEffect(() => {
    if (!device) return;
    setConnectedDevice(device);
  }, [device, setConnectedDevice]);

  const [passed, setPassed] = useState(null);
  const onResult = useCallback(result => {
    setPassed(result);
  }, []);

  return passed ? (
    <Success device={connectedDevice} />
  ) : (
    <DeviceAction
      overridesPreferredDeviceModel={deviceModelId}
      action={action}
      request={null}
      onResult={onResult}
    />
  );
}

GenuineCheck.Illustration = (
  <IllustrationContainer width="240px" height="245px" src={connectNano} />
);

const Footer = (props: unknown) => {
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
