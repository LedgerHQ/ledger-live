import { Text } from "@ledgerhq/native-ui";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/PreventDoubleClickButton";
import OnboardingRecoveryPhraseWarning from "../drawers/RecoveryPhraseWarning";

const RestoreRecoveryPhraseScene = () => {
  const { t } = useTranslation();
  return (
    <>
      <Text variant="h2" uppercase mb={3}>
        {t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.title")}
      </Text>
      <Text variant="body" color="neutral.c80" mb={3}>
        {t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.desc")}
      </Text>
    </>
  );
};

RestoreRecoveryPhraseScene.id = "RestoreRecoveryPhraseScene";

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
        testID="onboarding-importRecoveryPhrase-cta"
      >
        {t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.cta")}
      </Button>

      <OnboardingRecoveryPhraseWarning
        open={isOpened}
        onClose={() => setOpen(false)}
        onPress={next}
      />
    </>
  );
};

RestoreRecoveryPhraseScene.Next = Next;

export default RestoreRecoveryPhraseScene;
