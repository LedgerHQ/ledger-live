import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Button, Text, Icons, IconBox } from "@ledgerhq/native-ui";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { ScrollView } from "react-native";

type WarningRouteProps = RouteProp<
  { params: { onNext?: () => void } },
  "params"
>;

const OnboardingPreQuizModal = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<WarningRouteProps>();

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
