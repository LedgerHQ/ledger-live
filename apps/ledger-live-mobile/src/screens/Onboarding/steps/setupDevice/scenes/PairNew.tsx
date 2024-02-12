import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import Button from "~/components/PreventDoubleClickButton";

const PairNewScene = ({ deviceModelId }: { deviceModelId?: string }) => {
  const { t } = useTranslation();

  return (
    <>
      <Text variant="h2" color="palette.neutral.c100" mb={3} uppercase>
        {t(`onboarding.stepPairNew.${deviceModelId ?? "generic"}.title`)}
      </Text>
      <Text variant="paragraph" color="palette.neutral.c80" mb={10}>
        {t(`onboarding.stepPairNew.${deviceModelId ?? "generic"}.desc`)}
      </Text>
    </>
  );
};

PairNewScene.id = "PairNewScene";

const Next = ({ onNext, deviceModelId }: { onNext: () => void; deviceModelId?: string }) => {
  const { t } = useTranslation();

  return (
    <Button type="main" size="large" onPress={onNext} testID="Onboarding-PairNewNano">
      {t(`onboarding.stepPairNew.${deviceModelId ?? "generic"}.cta`)}
    </Button>
  );
};

PairNewScene.Next = Next;

export default PairNewScene;
