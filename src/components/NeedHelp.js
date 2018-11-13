// @flow

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, TouchableOpacity, Linking } from "react-native";
import LText from "./LText";
import IconExternalLink from "../icons/ExternalLink";
import colors from "../colors";
import { urls } from "../config/urls";

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

export default class NeedHelp extends PureComponent<{}> {
  render() {
    return (
      <TouchableOpacity
        style={styles.footer}
        hitSlop={hitSlop}
        onPress={() => Linking.openURL(urls.faq)}
      >
        <LText style={styles.footerText} semiBold>
          <Trans i18nKey="common.needHelp" />
        </LText>
        <IconExternalLink size={16} color={colors.live} />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  footerText: {
    color: colors.live,
    marginRight: 8,
  },
});
