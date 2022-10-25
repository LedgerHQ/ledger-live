import React from "react";
import { useTranslation } from "react-i18next";
import { Text, IconBoxList, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../../../../const";
import Button from "../../../../../components/PreventDoubleClickButton";

const items = [
  {
    title: "onboarding.stepSetupDevice.start.bullets.0.label",
    Icon: Icons.ClockMedium,
  },
  {
    title: "onboarding.stepSetupDevice.start.bullets.1.label",
    Icon: Icons.PenMedium,
  },
  {
    title: "onboarding.stepSetupDevice.start.bullets.2.label",
    Icon: Icons.CoffeeMedium,
  },
];

const IntroScene = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2" mb={10} uppercase lineHeight="34.8px">
        {t("onboarding.stepSetupDevice.start.title")}
      </Text>
      <IconBoxList
        items={items.map(item => ({ ...item, title: t(item.title) }))}
      />
    </>
  );
};

IntroScene.id = "IntroScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const next = () => {
    navigation.navigate(ScreenName.OnboardingModalWarning, {
      onNext,
    });
  };

  return (
    <Button type="main" size="large" onPress={next}>
      {t("onboarding.stepSetupDevice.start.cta")}
    </Button>
  );
};

IntroScene.Next = Next;

export default IntroScene;
