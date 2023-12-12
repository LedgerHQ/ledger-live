import React from "react";
import { useTranslation } from "react-i18next";
import { Text, Switch } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const PinCodeScene = () => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2" color="palette.neutral.c100" mb={3} uppercase>
        {t("onboarding.stepSetupDevice.pinCode.title")}
      </Text>
      <Text variant="paragraph" color="palette.neutral.c80" mb={10}>
        {t("onboarding.stepSetupDevice.pinCode.desc")}
      </Text>
    </>
  );
};

PinCodeScene.id = "PinCodeScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  const [checked, setChecked] = React.useState(false);

  const onChange = () => setChecked(currentState => !currentState);

  return (
    <>
      <Switch
        checked={checked}
        onChange={onChange}
        label={t("onboarding.stepSetupDevice.pinCode.checkboxDesc")}
        testID="onboarding-pinCode-switch"
      />
      <Button
        mt={6}
        disabled={!checked}
        type="main"
        size="large"
        onPress={onNext}
        testID="onboarding-pinCode-cta"
      >
        {t("onboarding.stepSetupDevice.pinCode.cta")}
      </Button>
    </>
  );
};

PinCodeScene.Next = Next;

export default PinCodeScene;
