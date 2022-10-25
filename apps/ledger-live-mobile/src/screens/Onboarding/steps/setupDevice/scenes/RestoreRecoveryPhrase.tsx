import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../../../../const";
import Button from "../../../../../components/PreventDoubleClickButton";
import { StackNavigatorNavigation } from "../../../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../../../components/RootNavigator/types/OnboardingNavigator";

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
      <Text variant="body" color="neutral.c80" mb={3}>
        {t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.desc")}
      </Text>
    </>
  );
};

RestoreRecoveryPhraseScene.id = "RestoreRecoveryPhraseScene";

const Next = ({ onNext }: { onNext: () => void }) => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<StackNavigatorNavigation<OnboardingNavigatorParamList>>();

  const handlePress = useCallback(() => {
    navigation.navigate(NavigatorName.OnboardingCarefulWarning, {
      screen: ScreenName.OnboardingModalRecoveryPhraseWarning,
      params: { onNext },
    });
  }, [navigation, onNext]);

  return (
    <Button type="main" size="large" onPress={handlePress}>
      {t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.cta")}
    </Button>
  );
};

RestoreRecoveryPhraseScene.Next = Next;

export default RestoreRecoveryPhraseScene;
