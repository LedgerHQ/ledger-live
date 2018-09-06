/* @flow */

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "./Touchable";
import Card from "./Card";
import LText from "./LText";
import colors from "../colors";
import IconInCircularCont from "./IconInCircularCont";
import { getElevationStyle } from "./ElevatedView";

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
      <Touchable onPress={onClick}>
        <Card style={[getElevationStyle(3), styles.cardStyle]}>
          <IconInCircularCont
            bgIconContainer={colors.lightLive}
            size={32}
            icon={icon}
          />
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
  cardStyle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginVertical: 4,
  },
  cardTextBlock: {
    flexDirection: "column",
    marginLeft: 16,
    flex: 1,
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
