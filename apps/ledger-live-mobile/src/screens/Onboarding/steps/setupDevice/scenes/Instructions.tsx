import React from "react";
import { useTranslation } from "react-i18next";
import { NumberedList } from "@ledgerhq/native-ui";
import { useRoute, RouteProp } from "@react-navigation/native";
import Button from "~/components/PreventDoubleClickButton";

const items = [
  {
    title: "onboarding.stepSetupDevice.setup.bullets.0.title",
    label: {
      nanoX: "onboarding.stepSetupDevice.setup.bullets.0.nanoX.label",
      nanoSP: "onboarding.stepSetupDevice.setup.bullets.0.nanoSP.label",
      nanoS: "onboarding.stepSetupDevice.setup.bullets.0.nanoS.label",
    },
  },
  {
    title: "onboarding.stepSetupDevice.setup.bullets.1.title",
    label: "onboarding.stepSetupDevice.setup.bullets.1.label",
  },
  {
    title: "onboarding.stepSetupDevice.setup.bullets.2.title",
    label: "onboarding.stepSetupDevice.setup.bullets.2.label",
  },
  {
    title: "onboarding.stepSetupDevice.setup.bullets.3.title",
    label: "onboarding.stepSetupDevice.setup.bullets.3.label",
  },
];

type CurrentRouteType = RouteProp<{ params: { deviceModelId: "nanoS" | "nanoX" } }, "params">;

const InstructionScene = () => {
  const { t } = useTranslation();
  const route = useRoute<CurrentRouteType>();

  return (
    <NumberedList
      flex={1}
      items={items.map(item => ({
        title: t(item.title),
        description:
          typeof item.label === "string"
            ? t(item.label)
            : t(item.label[route.params.deviceModelId]),
      }))}
    />
  );
};

InstructionScene.id = "InstructionScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();

  return (
    <Button type="main" size="large" onPress={onNext} testID="onboarding-stepSetupDevice-setup">
      {t("onboarding.stepSetupDevice.setup.cta")}
    </Button>
  );
};

InstructionScene.Next = Next;

export default InstructionScene;
