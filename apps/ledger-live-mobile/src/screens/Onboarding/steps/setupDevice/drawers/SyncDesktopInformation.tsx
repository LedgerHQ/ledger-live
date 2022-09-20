import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Button, Icons, ScrollContainer } from "@ledgerhq/native-ui";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { ModalHeader } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal";

type WarningRouteProps = RouteProp<
  { params: { onNext?: () => void } },
  "params"
>;

const OnboardingSyncDesktopInformation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<WarningRouteProps>();

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
