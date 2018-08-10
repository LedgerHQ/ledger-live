/* @flow */

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "./Touchable";
import Card from "./Card";
import LText from "./LText";
import colors from "../colors";

type SettingsCardType = {
  title: string,
  key: string,
  desc: string,
  onClick: () => void,
  icon: any,
};

export default class SettingsCard extends Component<{
  card: SettingsCardType,
}> {
  render() {
    const { card } = this.props;
    return (
      <Touchable style={[styles.root]} onPress={card.onClick}>
        <Card style={styles.cardStyle}>
          <View style={styles.imageContainer}>{card.icon}</View>
          <View style={styles.cardTextBlock}>
            <LText bold>{card.title}</LText>
            <LText>{card.desc}</LText>
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
    padding: 10,
    backgroundColor: "white",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  cardStyle: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 85,
  },
  cardTextBlock: {
    flexDirection: "column",
    padding: 15,
    flex: 1,
    flexWrap: "wrap",
  },
  imageContainer: {
    height: 32,
    width: 32,
    borderRadius: 50,
    backgroundColor: colors.lightLive,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
