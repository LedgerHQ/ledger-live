import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getDeviceModel } from "@ledgerhq/devices";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import PostOnboardingHubContent from "~/renderer/components/PostOnboardingHub/PostOnboardingHubContent";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingScreen = () => {
  const { t } = useTranslation();
  const device = useSelector(getCurrentDevice);

  const productName = device
    ? getDeviceModel(device.modelId).productName || device.modelId
    : "Ledger Device";

  return (
    <Flex flexDirection="row" width="100%" height="100%">
      <Flex
        justifyContent="center"
        flex={1}
        flexDirection="column"
        paddingLeft={100}
        paddingRight={50}
      >
        <Text variant="paragraph" fontSize={48} mb={8}>
          {t("postOnboarding.postOnboardingScreen.title")}
        </Text>
        <Text variant="paragraph" fontSize={14} color="neutral.c70" mb={8}>
          {t("postOnboarding.postOnboardingScreen.description", {
            deviceName: productName,
          })}
        </Text>
        <Text variant="paragraph" fontSize={14} color="neutral.c70" mb={8} maxWidth={450}>
          {t("postOnboarding.postOnboardingScreen.paragraph")}
        </Text>
        <Text variant="paragraph" fontSize={14} color="neutral.c70" mb={8}>
          {t("postOnboarding.postOnboardingScreen.bottomText")}
        </Text>
      </Flex>
      <Flex flex={1} paddingRight={100} paddingLeft={50}>
        <PostOnboardingHubContent />
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingScreen);
