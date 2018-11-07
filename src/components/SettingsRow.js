import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "./Touchable";
import LText from "./LText";
import colors from "../colors";
import ArrowRight from "../icons/ArrowRight";
import Check from "../icons/Check";

export default class SettingsRow extends Component<{
  onPress: () => void,
  title: string,
  titleStyle?: *,
  desc?: string,
  selected?: boolean,
  arrowRight?: boolean,
  iconLeft?: *,
  alignedTop?: boolean,
  compact?: boolean,
  children: React$Node,
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
      alignedTop,
      compact,
      selected,
    } = this.props;
    return (
      <Touchable
        onPress={onPress}
        style={[
          styles.root,
          alignedTop && styles.rootAlignedTop,
          compact && styles.rootCompact,
        ]}
      >
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
        <View style={styles.textBlock}>
          <LText
            semiBold={selected !== false}
            style={[styles.titleStyle, titleStyle]}
          >
            {title}
          </LText>
          {desc && <LText style={styles.description}>{desc}</LText>}
        </View>
        <View style={styles.rightBlock}>
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
        </View>
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
  rootAlignedTop: {
    alignItems: "flex-start",
  },
  rootCompact: {
    paddingVertical: 16,
  },
  textBlock: {
    flexDirection: "column",
    paddingRight: 16,
    flexGrow: 1,
    flexShrink: 1,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleStyle: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  description: { color: colors.grey, paddingTop: 5, fontSize: 14 },
  iconRightContainer: {
    marginLeft: 4,
  },
  iconLeft: {
    paddingRight: 16,
  },
  iconLeftContainer: {
    marginRight: 8,
  },
});
