import React from "react";
import { useTranslation } from "react-i18next";
import { Text, Switch } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const ExistingRecoveryPhraseScene = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2" color="palette.neutral.c100" mb={3} uppercase>
        {t("onboarding.stepRecoveryPhrase.existingRecoveryPhrase.title")}
      </Text>
      <Text variant="paragraph" color="palette.neutral.c80" mb={3}>
        {t("onboarding.stepRecoveryPhrase.existingRecoveryPhrase.paragraph1")}
      </Text>
      <Text variant="paragraph" color="palette.neutral.c80" mb={10}>
        {t("onboarding.stepRecoveryPhrase.existingRecoveryPhrase.paragraph2")}
      </Text>
    </>
  );
};

ExistingRecoveryPhraseScene.id = "ExistingRecoveryPhraseScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  const [checked, setChecked] = React.useState(false);

  const onChange = () => setChecked(currentState => !currentState);

  return (
    <>
      <Switch
        checked={checked}
        onChange={onChange}
        label={t("onboarding.stepRecoveryPhrase.existingRecoveryPhrase.checkboxDesc")}
        testID="onboarding-existingRecoveryPhrase-switch"
      />
      <Button
        mt={6}
        disabled={!checked}
        type="main"
        size="large"
        onPress={onNext}
        testID="onboarding-existingRecoveryPhrase-cta"
      >
        {t("onboarding.stepRecoveryPhrase.existingRecoveryPhrase.nextStep")}
      </Button>
    </>
  );
};

ExistingRecoveryPhraseScene.Next = Next;

export default ExistingRecoveryPhraseScene;
