import React from "react";
import { useTranslation } from "react-i18next";
import { Text, Switch } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const RecoveryPhraseScene = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2" color="palette.neutral.c100" mb={4} uppercase lineHeight="34.8px">
        {t("onboarding.stepSetupDevice.recoveryPhrase.title")}
      </Text>
      <Text variant="paragraph" color="palette.neutral.c80" mb={4}>
        {t("onboarding.stepSetupDevice.recoveryPhrase.desc")}
      </Text>
      <Text variant="paragraph" color="palette.neutral.c80" mb={10}>
        {t("onboarding.stepSetupDevice.recoveryPhrase.desc_1")}
      </Text>
    </>
  );
};

RecoveryPhraseScene.id = "RecoveryPhraseScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  const [checked, setChecked] = React.useState(false);

  const onChange = () => setChecked(currentState => !currentState);
  return (
    <>
      <Switch
        checked={checked}
        onChange={onChange}
        label={t("onboarding.stepSetupDevice.recoveryPhrase.checkboxDesc")}
        testID="onboarding-recoveryPhrase-switch"
      />
      <Button
        mt={6}
        disabled={!checked}
        type="main"
        size="large"
        onPress={onNext}
        testID="onboarding-recoveryPhrase-cta"
      >
        {t("onboarding.stepSetupDevice.recoveryPhrase.cta")}
      </Button>
    </>
  );
};

RecoveryPhraseScene.Next = Next;

export default RecoveryPhraseScene;
