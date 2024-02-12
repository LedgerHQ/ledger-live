import { IconBoxList, IconsLegacy, Text } from "@ledgerhq/native-ui";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/PreventDoubleClickButton";
import OnboardingSetupDeviceInformation from "../drawers/Warning";

const items = [
  {
    title: "onboarding.stepSetupDevice.start.bullets.0.label",
    Icon: IconsLegacy.ClockMedium,
  },
  {
    title: "onboarding.stepSetupDevice.start.bullets.1.label",
    Icon: IconsLegacy.PenMedium,
  },
  {
    title: "onboarding.stepSetupDevice.start.bullets.2.label",
    Icon: IconsLegacy.CoffeeMedium,
  },
];

const IntroScene = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2" mb={10} uppercase lineHeight="34.8px">
        {t("onboarding.stepSetupDevice.start.title")}
      </Text>
      <IconBoxList items={items.map(item => ({ ...item, title: t(item.title) }))} />
    </>
  );
};

IntroScene.id = "IntroScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();

  const [isOpened, setOpen] = useState(false);

  const next = () => {
    setOpen(false);
    setTimeout(() => onNext(), 200);
  };

  return (
    <>
      <Button
        type="main"
        size="large"
        onPress={() => setOpen(true)}
        testID="onboarding-stepSetupDevice-start"
      >
        {t("onboarding.stepSetupDevice.start.cta")}
      </Button>

      <OnboardingSetupDeviceInformation
        open={isOpened}
        onClose={() => setOpen(false)}
        onPress={next}
      />
    </>
  );
};

IntroScene.Next = Next;

export default IntroScene;
