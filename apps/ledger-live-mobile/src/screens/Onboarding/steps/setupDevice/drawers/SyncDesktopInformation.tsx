import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Button, Icons, ScrollContainer } from "@ledgerhq/native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ModalHeader } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal/index";
import { StackNavigatorProps } from "../../../../../components/RootNavigator/types/helpers";
import { OnboardingCarefulWarningParamList } from "../../../../../components/RootNavigator/types/OnboardingNavigator";
import { ScreenName } from "../../../../../const";

type NavigationProps = StackNavigatorProps<
  OnboardingCarefulWarningParamList,
  ScreenName.OnboardingModalSyncDesktopInformation
>;

const OnboardingSyncDesktopInformation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();

  const handlePress = () => {
    navigation.goBack();
    if (route.params.onNext) route.params.onNext();
  };

  return (
    <Flex flex={1} backgroundColor="background.main">
      <ScrollContainer flex={1}>
        <ModalHeader
          Icon={Icons.DevicesAltMedium}
          iconColor={"neutral.c100"}
          title={t("onboarding.stepImportAccounts.warning.title")}
          description={t("onboarding.stepImportAccounts.warning.desc")}
        />
      </ScrollContainer>
      <Button type="main" mt={6} size="large" onPress={handlePress}>
        {t("onboarding.stepImportAccounts.warning.cta")}
      </Button>
    </Flex>
  );
};

export default OnboardingSyncDesktopInformation;
