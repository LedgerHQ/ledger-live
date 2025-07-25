import React from "react";
import Actions from "./Actions";
import IconsHeader from "./IconsHeader";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Linking } from "react-native";

type Props = { onSyncMethodPress: () => void; navigateToChooseSyncMethod: () => void };

const Activation: React.FC<Props> = ({ onSyncMethodPress, navigateToChooseSyncMethod }) => {
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
          {t("walletSync.activation.screen.title")}
        </Text>
        <Text
          variant="bodyLineHeight"
          textAlign="center"
          color={colors.neutral.c70}
          alignSelf={"center"}
          maxWidth={330}
          numberOfLines={3}
          testID="walletsync-activation-description"
        >
          {t("walletSync.activation.screen.description")}
        </Text>
      </Flex>
      <Actions
        onPressHasAlreadyCreatedAKey={navigateToChooseSyncMethod}
        onPressSyncAccounts={onSyncMethodPress}
        onPressLearnMore={learnMoreLink ? onPressLearnMore : undefined}
      />
    </Flex>
  );
};

export default Activation;
