/* @flow */

import React, { Component } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Card from "./Card";
import LText from "./LText";
import colors from "../colors";
import Circle from "./Circle";

type Props = {
  title: string,
  desc: string,
  icon: any,
  onClick: Function,
};
export default class SettingsCard extends Component<Props> {
  render() {
    const { title, desc, icon, onClick } = this.props;
    return (
      <Card onPress={onClick} style={styles.cardStyle}>
        <Circle bg={colors.lightLive} size={32}>
          {icon}
        </Circle>
        <View style={styles.cardTextBlock}>
          <LText secondary semiBold style={styles.title}>
            {title}
          </LText>
          <LText style={styles.desc}>{desc}</LText>
        </View>
      </Card>
    );
  }
}

const styles = StyleSheet.create({
  cardStyle: {
    backgroundColor: colors.white,
    overflow: "visible",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginVertical: 4,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
  cardTextBlock: {
    flexDirection: "column",
    marginLeft: 16,
    flex: 1,
  },
  title: {
    color: colors.darkBlue,
    fontSize: 16,
    lineHeight: 17,
    marginBottom: 4,
  },
  desc: {
    color: colors.grey,
    fontSize: 14,
  },
});
