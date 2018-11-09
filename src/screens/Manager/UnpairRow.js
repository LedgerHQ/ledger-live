/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import colors from "../../colors";
import Row from "./Row";

type Props = {
  deviceId: string,
  onPress: () => void,
};

class UnpairRow extends PureComponent<Props> {
  render() {
    return (
      <Row
        title={<Trans i18nKey="UnpairRow.title" />}
        titleStyle={styles.title}
        onPress={this.props.onPress}
        compact
        top
        bottom
      />
    );
  }
}

export default UnpairRow;

const styles = StyleSheet.create({
  title: {
    color: colors.alert,
    textAlign: "center",
  },
});
