import React from "react";
import { useTranslation } from "react-i18next";
import { NumberedList } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const items = [
  {
    title: "onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.0.title",
  },
  {
    title: "onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.1.title",
    desc: `onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.1.label`,
  },
];

const ExistingRecoveryPhraseStep1Scene = () => {
  const { t } = useTranslation();

  return (
    <NumberedList
      flex={1}
      items={items.map(item => ({
        title: t(item.title),
        description: item.desc ? t(item.desc) : undefined,
      }))}
    />
  );
};

ExistingRecoveryPhraseStep1Scene.id = "ExistingRecoveryPhraseStep1Scene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();

  return (
    <Button
      type="main"
      size="large"
      onPress={onNext}
      testID="onboarding-existingRecoveryPhrase1-cta"
    >
      {t("onboarding.stepRecoveryPhrase.existingRecoveryPhrase.nextStep")}
    </Button>
  );
};

ExistingRecoveryPhraseStep1Scene.Next = Next;

export default ExistingRecoveryPhraseStep1Scene;
