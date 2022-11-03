import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Button, Text, Icons, IconBox } from "@ledgerhq/native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScrollView } from "react-native";
import { StackNavigatorProps } from "../../../../../components/RootNavigator/types/helpers";
import { OnboardingPreQuizModalNavigatorParamList } from "../../../../../components/RootNavigator/types/OnboardingNavigator";
import { ScreenName } from "../../../../../const";

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
    <Flex flex={1} justifyContent="space-between" bg="constant.purple">
      <ScrollView contentContainerStyle={{ alignItems: "center" }}>
        <IconBox
          Icon={Icons.TrophyMedium}
          color="constant.black"
          iconSize={24}
          boxSize={64}
        />
        <Text
          variant="h2"
          color="constant.black"
          mt={8}
          uppercase
          textAlign="center"
        >
          {t("onboarding.stepSetupDevice.hideRecoveryPhrase.warning.title")}
        </Text>
        <Text variant="body" color="constant.black" mt={6} textAlign="center">
          {t("onboarding.stepSetupDevice.hideRecoveryPhrase.warning.desc")}
        </Text>
      </ScrollView>
      <Button type="main" size="large" onPress={handlePress}>
        {t("onboarding.stepSetupDevice.hideRecoveryPhrase.warning.cta")}
      </Button>
    </Flex>
  );
};

export default OnboardingPreQuizModal;
