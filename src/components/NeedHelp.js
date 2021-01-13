// @flow

import React, { memo, useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, Linking } from "react-native";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import Touchable from "./Touchable";
import IconHelp from "../icons/Help";
import { urls } from "../config/urls";

function NeedHelp() {
  const { colors } = useTheme();
  const onPress = useCallback(() => Linking.openURL(urls.faq), []);
  return (
    <Touchable event="NeedHelp" style={styles.footer} onPress={onPress}>
      <IconHelp size={16} color={colors.live} />
      <LText style={styles.footerText} color="live" semiBold>
        <Trans i18nKey="common.needHelp" />
      </LText>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  footerText: {
    marginLeft: 8,
  },
});

export default memo(NeedHelp);
