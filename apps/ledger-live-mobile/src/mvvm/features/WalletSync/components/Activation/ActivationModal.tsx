import React from "react";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Linking } from "react-native";
import IconsHeader from "./IconsHeader";

type Props = { onSyncMethodPress: () => void };

const ActivationModal: React.FC<Props> = ({ onSyncMethodPress }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const walletSyncFF = useFeature("llmWalletSync");
  const learnMoreLink = walletSyncFF?.params?.learnMoreLink;

  useInitMemberCredentials();

  const onPressLearnMore = () => {
    if (learnMoreLink) {
      Linking.openURL(learnMoreLink);
    }
  };

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={24}>
      <IconsHeader />
      <Flex justifyContent="center" alignItems="center" flexDirection="column" rowGap={16}>
        <Text
          variant="h4"
          textAlign="center"
          lineHeight="32.4px"
          testID="walletsync-activation-title"
        >
          {t("walletSync.activation.screen.titleModal")}
        </Text>
        <Text
          variant="bodyLineHeight"
          textAlign="center"
          color={colors.neutral.c70}
          alignSelf={"center"}
          maxWidth={330}
          testID="walletsync-activation-description"
        >
          {t("walletSync.activation.screen.descriptionModal")}{" "}
          <Text
            variant="bodyLineHeight"
            color={colors.primary.c80}
            onPress={onPressLearnMore}
            testID="walletsync-activation-learn-more"
          >
            {t("common.learnMore")}
          </Text>
        </Text>
      </Flex>
      <Button
        type="main"
        alignSelf={"stretch"}
        minWidth={"100%"}
        size="large"
        onPress={onSyncMethodPress}
        accessibilityRole="button"
        testID="walletsync-activation-button"
      >
        {t("walletSync.activation.screen.cta")}
      </Button>
    </Flex>
  );
};

export default ActivationModal;
