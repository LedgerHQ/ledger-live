import React, { memo } from "react";
import { StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import Touchable, { Props as TouchableProps } from "./Touchable";
import LText from "./LText";
import { urls } from "~/utils/urls";
import Help from "~/icons/Help";

type Props = {
  url?: string;
  style?: TouchableProps["style"];
  color?: string;
};

function HelpLink({ url, style, color = "live" }: Props) {
  const { colors } = useTheme();
  return (
    <Touchable
      event="HelpLink"
      style={[styles.linkContainer, style]}
      onPress={() => Linking.openURL(url || urls.faq)}
    >
      <Help size={16} color={color || colors.live} />
      <LText style={[styles.linkText]} color={color} semiBold>
        <Trans i18nKey="common.needHelp" />
      </LText>
    </Touchable>
  );
}

export default memo<Props>(HelpLink);
const styles = StyleSheet.create({
  linkContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  linkText: {
    marginLeft: 6,
  },
});
