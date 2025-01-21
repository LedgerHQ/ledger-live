import React, { useCallback } from "react";
import i18next from "i18next";
import { StyleSheet, Linking } from "react-native";
import { urls } from "~/utils/urls";
import Touchable, { Props as TouchableProps } from "~/components/Touchable";
import LText from "~/components/LText";
import ExternalLink from "~/icons/ExternalLink";
import { Flex, Icons, Text, Button } from "@ledgerhq/native-ui";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";

type Props = {
  style?: {
    paddingHorizontal?: TouchableProps["style"];
  };
};

// "no associated accounts" text when adding/importing accounts
function NoAssociatedAccounts({ style }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainColor = colors.primary.c100;
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const fontSize = 13;
  const onPress = useCallback(() => Linking.openURL(urls.hedera.supportArticleLink), []);
  return llmNetworkBasedAddAccountFlow?.enabled ? (
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
  ) : (
    <Touchable onPress={onPress} style={[style?.paddingHorizontal, styles.root]}>
      <Text>{i18next.t("hedera.createHederaAccountHelp.text") as React.ReactNode}</Text>
      <LText
        style={[
          {
            fontSize,
            color: mainColor,
          },
        ]}
      >
        {t("hedera.createHederaAccountHelp.link") as React.ReactNode}
      </LText>
      <ExternalLink size={fontSize + 2} color={mainColor} />
    </Touchable>
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
