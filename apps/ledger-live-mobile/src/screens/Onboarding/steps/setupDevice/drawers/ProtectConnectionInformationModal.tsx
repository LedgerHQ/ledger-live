import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { Flex, Icons, ScrollListContainer, Box } from "@ledgerhq/native-ui";
import { ModalHeader } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { urls } from "../../../../../config/urls";
import Button from "../../../../../components/wrappedUi/Button";

const ProtectConnectionInformationModal = () => {
  const { t } = useTranslation();
  const servicesConfig = useFeature("protectServicesMobile");

  const restoreInfoDrawer =
    servicesConfig?.params?.onboardingRestore?.restoreInfoDrawer || {};
  const supportLink = restoreInfoDrawer?.supportLinkURI;

  const handlePressLearnMore = useCallback(() => {
    Linking.openURL(urls.fixConnectionIssues);
  }, []);

  const handlePressContactSupport = React.useCallback(() => {
    if (supportLink) Linking.openURL(supportLink);
  }, [supportLink]);

  return (
    <Flex flex={1} justifyContent="space-between" bg="background.drawer">
      <ScrollListContainer contentContainerStyle={{ padding: 16 }}>
        <Box>
          <ModalHeader
            title={t(
              "onboarding.stepPairNew.protectConnectionInformationModal.title",
            )}
            description={t(
              "onboarding.stepPairNew.protectConnectionInformationModal.description",
            )}
          />
        </Box>
      </ScrollListContainer>
      <Box mx={6} mb={6}>
        <Button
          type="main"
          size="large"
          onPress={handlePressLearnMore}
          Icon={Icons.ExternalLinkMedium}
          event={"button_clicked"}
          eventProperties={{
            button: "Learn more",
          }}
          mb={3}
        >
          {t("common.learnMore")}
        </Button>
        <Button
          type={"default"}
          size="large"
          onPress={handlePressContactSupport}
          Icon={Icons.ExternalLinkMedium}
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
