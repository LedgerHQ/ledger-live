import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Button, Text, IconsLegacy, IconBox } from "@ledgerhq/native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigatorProps } from "../../../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../../../const";
import { OnboardingCarefulWarningParamList } from "../../../../../components/RootNavigator/types/OnboardingNavigator";

type NavigationProps = StackNavigatorProps<
  OnboardingCarefulWarningParamList,
  ScreenName.OnboardingModalWarning
>;

const OnboardingSetupDeviceInformation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<NavigationProps["route"]>();

  const handlePress = useCallback(() => {
    navigation.goBack();
    if (route.params?.onNext) route.params.onNext();
  }, [navigation, route]);

  return (
    <Flex flex={1} justifyContent="space-between" backgroundColor="background.main">
      <Flex flex={1} alignItems="center" justifyContent="center">
        <IconBox Icon={IconsLegacy.WarningMedium} color="warning.c50" iconSize={24} boxSize={64} />
        <Text variant="h2" color="neutral.c100" mt={8} uppercase textAlign="center">
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
