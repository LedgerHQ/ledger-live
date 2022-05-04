import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Button, Text, Icons, IconBox } from "@ledgerhq/native-ui";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

type WarningRouteProps = RouteProp<
  { params: { onNext?: () => void } },
  "params"
>;

const OnboardingSetupDeviceInformation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<WarningRouteProps>();

  const handlePress = () => {
    navigation.goBack();
    if (route.params.onNext) route.params.onNext();
  };

  return (
    <Flex
      flex={1}
      justifyContent="space-between"
      backgroundColor="background.main"
    >
      <Flex flex={1} alignItems="center" justifyContent="center">
        <IconBox
          Icon={Icons.WarningMedium}
          color="warning.c100"
          iconSize={24}
          boxSize={64}
        />
        <Text
          variant="h2"
          color="neutral.c100"
          mt={8}
          uppercase
          textAlign="center"
        >
          {t("onboarding.stepSetupDevice.start.warning.title")}
        </Text>
        <Text variant="paragraph" color="neutral.c80" mt={6} textAlign="center">
          {t("onboarding.stepSetupDevice.start.warning.desc")}
        </Text>
      </Flex>
      <Button type="main" size="large" onPress={handlePress}>
        {t("onboarding.stepSetupDevice.start.warning.ctaText")}
      </Button>
    </Flex>
  );
};

export default OnboardingSetupDeviceInformation;
