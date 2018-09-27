// @flow
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import colors from "../colors";
import LText from "./LText";

class HeaderSynchronizing extends PureComponent<{
  t: *,
}> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <LText secondary style={styles.title} semiBold>
          {t("portfolio.syncPending")}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    color: colors.darkBlue,
    justifyContent: "center",
  },
  description: {
    marginTop: 5,
    fontSize: 14,
    color: colors.grey,
  },
});

export default translate()(HeaderSynchronizing);
