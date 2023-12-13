import React from "react";
import { useTranslation } from "react-i18next";
import { NumberedList } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const RestoreRecoveryPhraseStep1Scene = ({ deviceModelId }: { deviceModelId: string }) => {
  const { t } = useTranslation();

  const items = [
    {
      title: "onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.0.title",
      desc: `onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.0.${deviceModelId}.label`,
    },
    {
      title: "onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.1.title",
      desc: `onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.1.label`,
    },
    {
      title: "onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.2.title",
      desc: `onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.2.label`,
    },
    {
      title: "onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.3.title",
      desc: `onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.3.label`,
    },
  ];

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

RestoreRecoveryPhraseStep1Scene.id = "RestoreRecoveryPhraseStep1Scene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  return (
    <Button
      type="main"
      size="large"
      onPress={onNext}
      testID="onboarding-importRecoveryPhrase-nextStep"
    >
      {t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.nextStep")}
    </Button>
  );
};

RestoreRecoveryPhraseStep1Scene.Next = Next;

export default RestoreRecoveryPhraseStep1Scene;
