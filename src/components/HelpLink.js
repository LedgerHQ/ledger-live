// @flow

import React, { PureComponent } from "react";
import { TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import LText from "./LText";
import colors from "../colors";
import { urls } from "../config/urls";
import Help from "../icons/Help";

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

class HelpLink extends PureComponent<{ style?: * }> {
  render() {
    const { style } = this.props;
    return (
      <TouchableOpacity
        style={[styles.linkContainer, style]}
        hitSlop={hitSlop}
        onPress={() => Linking.openURL(urls.faq)}
      >
        <Help size={16} color={colors.live} />
        <LText style={styles.linkText} semiBold>
          <Trans i18nKey="common.needHelp" />
        </LText>
      </TouchableOpacity>
    );
  }
}

export default HelpLink;

const styles = StyleSheet.create({
  linkContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  linkText: {
    color: colors.live,
    marginLeft: 6,
  },
});
