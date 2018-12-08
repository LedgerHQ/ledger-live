/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { Trans, translate } from "react-i18next";
import LText from "./LText";

type Props = {
  tintColor: string,
  focused: boolean,
  i18nKey: string,
  Icon: *,
};

class TabIcon extends Component<Props> {
  render() {
    const { Icon, i18nKey, tintColor, focused } = this.props;

    return (
      <View style={styles.root}>
        <Icon size={18} color={tintColor} />
        <LText
          numberOfLines={1}
          semiBold={!focused}
          bold={focused}
          secondary
          style={[styles.text, { color: tintColor }]}
        >
          <Trans i18nKey={i18nKey} />
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  text: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
});

export default translate()(TabIcon);
