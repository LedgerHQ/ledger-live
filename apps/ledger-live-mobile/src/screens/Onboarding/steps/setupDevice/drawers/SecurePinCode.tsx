import React from "react";
import { useTranslation } from "react-i18next";
import {
  Flex,
  Button,
  List,
  Icons,
  Text,
  ScrollListContainer,
} from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";

const content = [
  "onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.0.label",
  "onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.1.label",
  "onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.2.label",
  "onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.3.label",
  "onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.4.label",
  "onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.5.label",
  "onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.6.label",
  "onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.7.label",
];

const OnboardingSetupDeviceInformation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <Flex
      flex={1}
      justifyContent="space-between"
      backgroundColor="background.main"
    >
      <ScrollListContainer contentContainerStyle={{ padding: 16 }}>
        <Text variant="h1" mb={6}>
          {t("onboarding.stepSetupDevice.pinCodeSetup.infoModal.title")}
        </Text>
        <List
          items={[...content].slice(0, 4).map(item => ({
            title: t(item),
            bullet: <Icons.CheckAloneMedium size={20} color="success.c100" />,
          }))}
          itemSeparatorProps={{ mb: 7 }}
        />
        <Flex my={8} borderBottomColor="neutral.c40" borderBottomWidth={1} />
        <List
          items={[...content].slice(4, 8).map(item => ({
            title: t(item),
            bullet: <Icons.CloseMedium size={20} color="error.c100" />,
          }))}
          itemSeparatorProps={{ mb: 7 }}
        />
      </ScrollListContainer>
      <Button m={6} type="main" size="large" onPress={navigation.goBack}>
        {t("onboarding.stepSetupDevice.pinCodeSetup.cta")}
      </Button>
    </Flex>
  );
};

export default OnboardingSetupDeviceInformation;
