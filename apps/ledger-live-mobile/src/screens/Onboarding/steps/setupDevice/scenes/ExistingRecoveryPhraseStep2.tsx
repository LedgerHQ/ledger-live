import React from "react";
import { useTranslation } from "react-i18next";
import { NumberedList } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const items = [
  {
    title: "onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.2.title",
    desc: "onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.2.label",
  },
  {
    title: "onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.3.title",
    desc: "onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.3.label",
  },
  {
    title: "onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.4.title",
  },
];

const ExistingRecoveryPhraseStep2Scene = () => {
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

ExistingRecoveryPhraseStep2Scene.id = "ExistingRecoveryPhraseStep2Scene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();

  return (
    <Button
      type="main"
      size="large"
      onPress={onNext}
      testID="onboarding-existingRecoveryPhrase2-cta"
    >
      {t("onboarding.stepRecoveryPhrase.existingRecoveryPhrase.nextStep")}
    </Button>
  );
};

ExistingRecoveryPhraseStep2Scene.Next = Next;

export default ExistingRecoveryPhraseStep2Scene;
