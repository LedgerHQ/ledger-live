import React, { useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Linking } from "react-native";
import { Flex, IconsLegacy, ScrollListContainer, Box, Text } from "@ledgerhq/native-ui";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { urls } from "~/utils/urls";
import Button from "~/components/wrappedUi/Button";

const ProtectConnectionInformationModal = () => {
  const { t } = useTranslation();
  const servicesConfig = useFeature("protectServicesMobile");

  const restoreInfoDrawer = servicesConfig?.params?.onboardingRestore?.restoreInfoDrawer;
  const supportLink = restoreInfoDrawer?.supportLinkURI;

  const handlePressBluetoothIssue = useCallback(() => {
    Linking.openURL(urls.pairingIssues);
  }, []);

  const handlePressLearnHowToUpdate = useCallback(() => {
    Linking.openURL(urls.lnxFirmwareUpdate);
  }, []);

  const handlePressContactSupport = React.useCallback(() => {
    if (supportLink) Linking.openURL(supportLink);
  }, [supportLink]);

  return (
    <Flex flex={1} justifyContent="space-between" bg="background.drawer">
      <ScrollListContainer contentContainerStyle={{ padding: 16 }}>
        <Box>
          <Text variant="h1" color="neutral.c100" uppercase mb={6}>
            {t("onboarding.stepPairNew.protectConnectionInformationModal.title")}
          </Text>
          <Text variant="body" color="neutral.c80" mb={6}>
            <Trans
              i18nKey="onboarding.stepPairNew.protectConnectionInformationModal.description"
              components={{
                LinkBluethooth: (
                  <Text
                    variant="body"
                    color="neutral.c80"
                    onPress={handlePressBluetoothIssue}
                    style={{ textDecorationLine: "underline" }}
                  >
                    {""}
                  </Text>
                ),
              }}
            />
          </Text>
        </Box>
      </ScrollListContainer>
      <Box mx={6} mb={6}>
        <Button
          type="main"
          size="large"
          onPress={handlePressLearnHowToUpdate}
          Icon={IconsLegacy.ExternalLinkMedium}
          event={"button_clicked"}
          eventProperties={{
            button: "Learn more",
          }}
          mb={3}
        >
          {t("onboarding.stepPairNew.protectConnectionInformationModal.learnHowToUpdate")}
        </Button>
        <Button
          type={"default"}
          size="large"
          onPress={handlePressContactSupport}
          Icon={IconsLegacy.ExternalLinkMedium}
          event={"link_clicked"}
          eventProperties={{
            button: "Contact Ledger Support",
          }}
        >
          {t("onboarding.stepProtect.extraInfo.supportLink")}
        </Button>
      </Box>
    </Flex>
  );
};

export default ProtectConnectionInformationModal;
