/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Trash from "../../../icons/Trash";
import colors from "../../../colors";
import Row from "./Row";

type Props = {
  deviceId: string,
  onPress: () => void,
};

class RemoveRow extends PureComponent<Props> {
  render() {
    return (
      <Row
        iconLeft={
          <View style={styles.iconContainer}>
            <Trash color={colors.alert} size={16} />
          </View>
        }
        title={<Trans i18nKey="RemoveRow.title" />}
        titleStyle={styles.title}
        onPress={this.props.onPress}
        compact
        top
        bottom
      />
    );
  }
}

export default RemoveRow;

const styles = StyleSheet.create({
  title: {
    color: colors.alert,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: colors.lightAlert,
    marginRight: 16,
  },
});
