import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Button, Text, List, IconsLegacy, ScrollListContainer } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";

const content = [
  "onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.0.label",
  "onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.1.label",
  "onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.2.label",
  "onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.3.label",
  "onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.4.label",
];

const Bold = ({ children }: { children?: React.ReactNode }) => (
  <Text fontWeight="bold" uppercase>
    {children}
  </Text>
);

const OnboardingSetupRecoveryPhrase = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <>
      <ScrollListContainer flex={1} contentContainerStyle={{ padding: 16 }}>
        <Text variant="h1" color="neutral.c100" mb={8}>
          {t("onboarding.stepSetupDevice.hideRecoveryPhrase.title")}
        </Text>
        <List
          items={content.map(item => ({
            title: <Trans i18nKey={item} components={{ bold: <Bold /> }} />,
            bullet: <IconsLegacy.CheckAloneMedium size={20} color="success.c50" />,
          }))}
        />
      </ScrollListContainer>
      <Button type="main" m={6} size="large" onPress={navigation.goBack}>
        {t("onboarding.stepSetupDevice.hideRecoveryPhrase.cta")}
      </Button>
    </>
  );
};

export default OnboardingSetupRecoveryPhrase;
