import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const QuizzFinalScene = ({ success }: { success: boolean }) => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2" color="palette.neutral.c100" mb={3} uppercase lineHeight="34.8px">
        {t(`onboarding.quizz.final.${success ? "successTitle" : "failTitle"}`)}
      </Text>
      <Text variant="paragraph" color="palette.neutral.c80" mb={10}>
        {t(`onboarding.quizz.final.${success ? "successText" : "failText"}`)}
      </Text>
    </>
  );
};

QuizzFinalScene.id = "QuizzFinalScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  return (
    <Button type="main" size="large" onPress={onNext} testID="onboarding-quizz-final-cta">
      {t("onboarding.quizz.final.cta")}
    </Button>
  );
};

QuizzFinalScene.Next = Next;

export default QuizzFinalScene;
