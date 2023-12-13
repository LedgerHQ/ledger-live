import React from "react";
import { useTranslation } from "react-i18next";
import { Text, IconBoxList, IconsLegacy } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const items = [
  {
    title: "onboarding.stepSetupDevice.hideRecoveryPhrase.bullets.0.label",
    /*
     ** @TODO: Correct icon isn't included in the ui library yet.
     ** Replace this placeholder as soon as it's available.
     */
    Icon: IconsLegacy.MinusMedium,
  },
  {
    title: "onboarding.stepSetupDevice.hideRecoveryPhrase.bullets.1.label",
    Icon: IconsLegacy.EyeNoneMedium,
  },
];

const HideRecoveryPhraseScene = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2" color="palette.neutral.c100" mb={3} uppercase>
        {t("onboarding.stepSetupDevice.hideRecoveryPhrase.title")}
      </Text>
      <Text variant="paragraph" color="palette.neutral.c80" mb={16}>
        {t("onboarding.stepSetupDevice.hideRecoveryPhrase.desc")}
      </Text>
      <IconBoxList items={items.map(item => ({ ...item, title: t(item.title) }))} />
    </>
  );
};

HideRecoveryPhraseScene.id = "HideRecoveryPhraseScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();

  return (
    <Button type="main" size="large" onPress={onNext} testID="onboarding-hideRecoveryPhrase-done">
      {t("onboarding.stepSetupDevice.hideRecoveryPhrase.finalCta")}
    </Button>
  );
};

HideRecoveryPhraseScene.Next = Next;

export default HideRecoveryPhraseScene;
