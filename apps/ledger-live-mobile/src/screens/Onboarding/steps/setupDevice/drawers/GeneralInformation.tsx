import React, { useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";
import {
  Flex,
  Button,
  Text,
  NumberedList,
  IconsLegacy,
  Link as TextLink,
  ScrollListContainer,
} from "@ledgerhq/native-ui";
import { urls } from "~/utils/urls";

const bullets = [
  "onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.bullets.0.label",
  "onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.bullets.1.label",
  "onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.bullets.2.label",
];

const OnboardingGeneralInformation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handlePress = useCallback(() => {
    // Opening the link with some app, if the URL scheme is "http" the web link should be opened
    // by some browser in the mobile
    Linking.openURL(urls.recoveryPhraseInfo);
  }, []);

  return (
    <Flex flex={1} justifyContent="space-between">
      <ScrollListContainer>
        <Flex p={6} backgroundColor="background.main">
          <Text variant="h1" color="neutral.c100" uppercase mb={6}>
            {t("onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.title")}
          </Text>
          <Text variant="paragraph" color="neutral.c80" mb={6}>
            {t("onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.desc")}
          </Text>
          <Text variant="paragraph" color="neutral.c80" mb={6}>
            {t("onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.desc_1")}
          </Text>
          <TextLink
            onPress={handlePress}
            Icon={IconsLegacy.ExternalLinkMedium}
            iconPosition="right"
            type="color"
            style={{ justifyContent: "flex-start" }}
          >
            {t("onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.link")}
          </TextLink>
          <Flex my={10} borderBottomColor="neutral.c40" borderBottomWidth={1} />
          <Text variant="h1" color="neutral.c100" uppercase mb={6}>
            {t("onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.title_1")}
          </Text>
          <NumberedList items={bullets.map(item => ({ title: t(item) }))} />
        </Flex>
      </ScrollListContainer>
      <Button m={6} type="main" size="large" onPress={navigation.goBack}>
        {t("onboarding.stepSetupDevice.hideRecoveryPhrase.cta")}
      </Button>
    </Flex>
  );
};

export default memo(OnboardingGeneralInformation);
