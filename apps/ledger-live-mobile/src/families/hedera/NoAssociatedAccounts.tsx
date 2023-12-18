import React, { useCallback } from "react";
import i18next from "i18next";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Linking, Text } from "react-native";
import { urls } from "~/utils/urls";
import Touchable, { Props as TouchableProps } from "~/components/Touchable";
import LText from "~/components/LText";
import ExternalLink from "~/icons/ExternalLink";

type Props = {
  style?: {
    paddingHorizontal?: TouchableProps["style"];
  };
};

// "no associated accounts" text when adding/importing accounts
function NoAssociatedAccounts({ style }: Props) {
  const { colors } = useTheme();
  const c = colors.live;
  const fontSize = 13;
  const onPress = useCallback(() => Linking.openURL(urls.hedera.supportArticleLink), []);
  return (
    <Touchable onPress={onPress} style={[style?.paddingHorizontal, styles.root]}>
      <Text>{i18next.t("hedera.createHederaAccountHelp.text") as React.ReactNode}</Text>
      <LText
        style={[
          {
            fontSize,
            color: c,
          },
        ]}
      >
        {i18next.t("hedera.createHederaAccountHelp.link") as React.ReactNode}
      </LText>
      <ExternalLink size={fontSize + 2} color={c} />
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
});
export default NoAssociatedAccounts;
