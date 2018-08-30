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
            <LText secondary semiBold style={styles.title}>
              {card.title}
            </LText>
            <LText style={styles.desc}>{card.desc}</LText>
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
