/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import colors from "../../colors";
import Row from "./Row";

type Props = {
  navigation: *,
};

class UnpairRow extends PureComponent<Props> {
  render() {
    return (
      <Row
        title={<Trans i18nKey="UnpairRow.title" />}
        titleStyle={styles.title}
        compact
        top
        bottom
      />
    );
  }
}

export default withNavigation(UnpairRow);

const styles = StyleSheet.create({
  title: {
    color: colors.alert,
    textAlign: "center",
  },
});
