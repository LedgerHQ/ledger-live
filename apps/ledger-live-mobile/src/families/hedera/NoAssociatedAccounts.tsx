import React, { useCallback } from "react";
import { StyleSheet, Linking } from "react-native";
import { urls } from "~/utils/urls";
import { Flex, Icons, Text, Button } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

// "no associated accounts" text when adding/importing accounts
function NoAssociatedAccounts() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const createAccountSupportUrl = useLocalizedUrl(urls.hedera.supportArticleLink);

  const onPress = useCallback(() => {
    Linking.openURL(createAccountSupportUrl);
  }, [createAccountSupportUrl]);

  return (
    <>
      <Flex flex={1} alignSelf="stretch" alignItems="center">
        <Text style={styles.title}> {t("hedera.createHederaAccountHelp.title")}</Text>

        <Text style={styles.desc} color="neutral.c70">
          {t("hedera.createHederaAccountHelp.description")}
        </Text>
      </Flex>
      <Button
        size="large"
        type="shade"
        testID="button-create-account"
        Icon={() => <Icons.ExternalLink color={colors.neutral.c20} size="S" />}
        onPress={onPress}
      >
        {t("hedera.createHederaAccountHelp.link")}
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    marginTop: 32,
    fontSize: 24,
    textAlign: "center",
    width: "100%",
    fontWeight: 600,
    fontStyle: "normal",
    lineHeight: 32.4,
    letterSpacing: 0.75,
  },
  desc: {
    marginTop: 16,
    marginBottom: 32,
    fontSize: 14,
    width: "100%",
    lineHeight: 23.8,
    fontWeight: 500,
    textAlign: "center",
    alignSelf: "stretch",
  },
  cta: {
    textTransform: "capitalize",
  },
});
export default NoAssociatedAccounts;
