import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Button, Text } from "@ledgerhq/native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "react-native";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingPreQuizModalNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { ScreenName } from "~/const";
import quizImage3 from "~/images/illustration/Light/_060.png";

type NavigationProps = StackNavigatorProps<
  OnboardingPreQuizModalNavigatorParamList,
  ScreenName.OnboardingPreQuizModal
>;

const OnboardingPreQuizModal = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<NavigationProps["route"]>();

  const handlePress = () => {
    navigation.goBack();
    if (route.params.onNext) route.params.onNext();
  };

  return (
    <Flex flex={1} justifyItems="space-between" justifyContent="center" bg="constant.purple">
      <Flex flex={1} flexGrow={1} justifyContent="center">
        <Image source={quizImage3} style={{ width: "100%", height: 280 }} resizeMode="contain" />

        <Text variant="h2" color="constant.black" mt={8} uppercase textAlign="center">
          {t("onboarding.stepSetupDevice.hideRecoveryPhrase.warning.title")}
        </Text>
        <Text variant="body" color="constant.black" mt={6} textAlign="center">
          {t("onboarding.stepSetupDevice.hideRecoveryPhrase.warning.desc")}
        </Text>
      </Flex>

      <Button type="main" size="large" onPress={handlePress} testID="onboarding-quizz-start">
        {t("onboarding.stepSetupDevice.hideRecoveryPhrase.warning.cta")}
      </Button>
    </Flex>
  );
};

export default OnboardingPreQuizModal;
