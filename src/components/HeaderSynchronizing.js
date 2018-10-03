// @flow
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import LiveLogo from "../icons/LiveLogoIcon";
import colors from "../colors";
import LText from "./LText";
import Spinning from "./Spinning";

class HeaderSynchronizing extends PureComponent<{
  t: *,
}> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <Spinning>
          <LiveLogo size={16} color={colors.grey} />
        </Spinning>
        <LText secondary style={styles.title} semiBold numberOfLines={1}>
          {t("portfolio.syncPending")}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    color: colors.grey,
    justifyContent: "center",
    marginLeft: 10,
  },
});

export default translate()(HeaderSynchronizing);
