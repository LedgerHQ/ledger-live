import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { NumberedList } from "@ledgerhq/native-ui";
import NanoDeviceCheckIcon from "~/icons/NanoDeviceCheckIcon";
import NanoDeviceCancelIcon from "~/icons/NanoDeviceCancelIcon";
import Button from "~/components/PreventDoubleClickButton";

const items = [
  {
    title: "onboarding.stepSetupDevice.pinCodeSetup.bullets.0.title",
    desc: "onboarding.stepSetupDevice.pinCodeSetup.bullets.0.desc",
  },
  {
    title: "onboarding.stepSetupDevice.pinCodeSetup.bullets.1.title",
    desc: "onboarding.stepSetupDevice.pinCodeSetup.bullets.1.desc",
  },
];

const PinCodeInstructionsScene = () => {
  const { t } = useTranslation();

  return (
    <NumberedList
      flex={1}
      items={items.map(item => ({
        title: t(item.title),
        description: (
          <Trans
            i18nKey={item.desc}
            components={{
              validIcon: <NanoDeviceCheckIcon size={12} />,
              cancelIcon: <NanoDeviceCancelIcon size={12} />,
            }}
          />
        ),
      }))}
    />
  );
};

PinCodeInstructionsScene.id = "PinCodeInstructionsScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  return (
    <Button type="main" size="large" onPress={onNext} testID="onboarding-pinCodeSetup-cta">
      {t("onboarding.stepSetupDevice.pinCodeSetup.cta")}
    </Button>
  );
};

PinCodeInstructionsScene.Next = Next;

export default PinCodeInstructionsScene;
