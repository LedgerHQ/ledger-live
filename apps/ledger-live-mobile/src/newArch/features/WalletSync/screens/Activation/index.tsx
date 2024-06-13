import React from "react";
import SafeAreaView from "~/components/SafeAreaView";
import { Icons, Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import IconWrapper from "LLM/features/WalletSync/components/IconWrapper";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";

function View() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      isFlex
      style={{
        flexDirection: "column",
        gap: 26,
        marginHorizontal: 24,
        marginTop: 114,
      }}
    >
      <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={24}>
        <Flex justifyContent="center" alignItems="center" flexDirection="row">
          <IconWrapper>
            <Icons.Mobile color={colors.constant.purple} />
          </IconWrapper>
          <IconWrapper opacity="1">
            <Icons.Refresh size="L" color={colors.constant.purple} />
          </IconWrapper>
          <IconWrapper>
            <Icons.Desktop color={colors.constant.purple} />
          </IconWrapper>
        </Flex>
        <Flex justifyContent="center" alignItems="center" flexDirection="column" rowGap={16}>
          <Text variant="h4" textAlign="center" lineHeight="32.4px">
            {t("walletSync.activation.drawerAndSettings.title")}
          </Text>
          <Text
            variant="bodyLineHeight"
            textAlign="center"
            color={colors.neutral.c70}
            alignSelf={"center"}
            maxWidth={330}
            numberOfLines={3}
          >
            {t("walletSync.activation.drawerAndSettings.description")}
          </Text>
        </Flex>
      </Flex>
      <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={32}>
        <Button
          type="main"
          alignSelf={"stretch"}
          minWidth={"100%"}
          onPress={() => null}
          size="large"
        >
          {t("walletSync.activation.drawerAndSettings.mainCta")}
        </Button>
        <Link onPress={() => null} size="large">
          {t("walletSync.activation.drawerAndSettings.secondCta")}
        </Link>
      </Flex>
    </SafeAreaView>
  );
}

const WalletSyncActivation = () => <View />;

export default WalletSyncActivation;
