import React from "react";
import i18next from "i18next";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Linking, Text } from "react-native";

import { urls } from "../../config/urls";
import Touchable from "../../components/Touchable";
import LText from "../../components/LText";
import ExternalLink from "../../icons/ExternalLink";

type Props = {
  style?: *,
};

// "no associated accounts" text when adding/importing accounts
const NoAssociatedAccounts = ({ style }: Props) => {
  const { colors } = useTheme();
  const c = colors.live;
  const fontSize = 13;

  return (
    <Touchable
      onPress={() => Linking.openURL(urls.hedera.supportArticleLink)}
      style={[style.paddingHorizontal, styles.root]}
    >
      <Text>{i18next.t("hedera.createHederaAccountHelp.text")}</Text>
      <LText style={[{ fontSize, color: c }]}>
        {i18next.t("hedera.createHederaAccountHelp.link")}
      </LText>
      <Text> </Text>
      <ExternalLink size={fontSize + 2} color={c} />
    </Touchable>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    flexWrap: true,
  },
});

export default NoAssociatedAccounts;
