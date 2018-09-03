// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import Check from "../../images/icons/Check";

import colors from "../../colors";

type Props = {
  icon: React$Node,
  text: React$Node,
  resolved: boolean,
  style?: *,
};

class ConnectStep extends PureComponent<Props> {
  render(): React$Node {
    const { icon, text, resolved, style } = this.props;
    return (
      <View
        style={[
          styles.wrapper,
          resolved ? styles.wrapperResolved : undefined,
          style,
        ]}
      >
        {resolved && (
          <View style={styles.checkWrapper}>
            <Check size={14} color={colors.white} />
          </View>
        )}
        <View style={styles.iconWrapper}>{icon}</View>
        <View style={styles.textWrapper}>{text}</View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "column",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: colors.fog,
    paddingVertical: 24,
    paddingHorizontal: 42,
  },
  wrapperResolved: {
    borderColor: colors.live,
  },
  checkWrapper: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: colors.live,
    padding: 5,
    borderRadius: 20,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  textWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ConnectStep;
