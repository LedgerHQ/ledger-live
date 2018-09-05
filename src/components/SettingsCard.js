/* @flow */

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "./Touchable";
import Card from "./Card";
import LText from "./LText";
import colors from "../colors";

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
      <Touchable style={[styles.root]} onPress={onClick}>
        <Card style={styles.cardStyle}>
          <View style={styles.imageContainer}>{icon}</View>
          <View style={styles.cardTextBlock}>
            <LText secondary semiBold style={styles.title}>
              {title}
            </LText>
            <LText style={styles.desc}>{desc}</LText>
          </View>
        </Card>
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    marginVertical: 4,
  },
  cardStyle: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTextBlock: {
    flexDirection: "column",
    marginLeft: 16,
    flex: 1,
  },
  imageContainer: {
    height: 32,
    width: 32,
    borderRadius: 50,
    backgroundColor: colors.lightLive,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.darkBlue,
    fontSize: 14,
    lineHeight: 17,
    marginBottom: 4,
  },
  desc: {
    color: colors.grey,
    fontSize: 12,
  },
});
