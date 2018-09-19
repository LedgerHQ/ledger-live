import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "./Touchable";
import LText from "./LText";
import colors from "../colors";
import ArrowRight from "../icons/ArrowRight";
import Check from "../icons/Check";

const flowPush = <View style={{ flex: 1 }} />;

export default class SettingsRow extends Component<{
  onPress: () => void,
  title: string,
  titleStyle?: *,
  desc?: string,
  selected?: boolean,
  arrowRight?: boolean,
  iconLeft?: *,
  center?: boolean,
  children: *,
}> {
  render() {
    const {
      onPress,
      children,
      title,
      titleStyle,
      desc,
      arrowRight,
      iconLeft,
      center,
      selected,
    } = this.props;
    return (
      <Touchable
        onPress={onPress}
        style={[styles.root, center && styles.center]}
      >
        {iconLeft && <View style={{ paddingHorizontal: 10 }}>{iconLeft}</View>}
        <View style={styles.textBlock}>
          <LText semiBold style={[styles.titleStyle, titleStyle]}>
            {title}
          </LText>
          {desc && <LText style={styles.description}>{desc}</LText>}
        </View>
        {!center ? flowPush : null}
        {children}
        {arrowRight ? (
          <View style={styles.iconRightContainer}>
            <ArrowRight size={16} color={colors.grey} />
          </View>
        ) : selected ? (
          <View style={styles.iconLeftContainer}>
            <Check size={16} color={colors.live} />
          </View>
        ) : null}
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: "white",
    marginBottom: 2,
  },
  center: {
    justifyContent: "center",
  },
  textBlock: {
    flexDirection: "column",
    paddingRight: 16,
    flexGrow: 1,
    flexShrink: 1,
  },
  titleStyle: {
    fontSize: 16,
  },
  description: { color: colors.grey, paddingTop: 5, fontSize: 14 },
  iconRightContainer: {
    marginLeft: 8,
  },
  iconLeftContainer: {
    marginRight: 8,
  },
});
