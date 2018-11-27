import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "./Touchable";
import LText from "./LText";
import colors from "../colors";
import ArrowRight from "../icons/ArrowRight";
import Check from "../icons/Check";
import IconHelp from "../icons/Info";

export default class SettingsRow extends Component<{
  onPress: () => void,
  onHelpPress: () => void,
  title: React$Node,
  titleStyle?: *,
  desc?: React$Node,
  selected?: boolean,
  arrowRight?: boolean,
  iconLeft?: *,
  alignedTop?: boolean,
  compact?: boolean,
  children: React$Node,
  borderTop?: boolean,
  noTextDesc?: boolean,
}> {
  render() {
    const {
      onPress,
      onHelpPress,
      children,
      title,
      titleStyle,
      desc,
      arrowRight,
      iconLeft,
      alignedTop,
      compact,
      selected,
      borderTop,
      noTextDesc,
    } = this.props;

    let title$ = (
      <View style={styles.titleContainer}>
        <LText
          semiBold={selected !== false}
          style={[styles.titleStyle, titleStyle]}
        >
          {title}
        </LText>
        {!!onHelpPress && (
          <View style={styles.helpIcon}>
            <IconHelp size={16} color={colors.grey} />
          </View>
        )}
      </View>
    );

    if (onHelpPress) {
      title$ = <Touchable onPress={onHelpPress}>{title$}</Touchable>;
    }

    return (
      <Touchable
        onPress={onPress}
        style={[
          styles.root,
          alignedTop && styles.rootAlignedTop,
          compact && styles.rootCompact,
          borderTop && styles.borderTop,
        ]}
      >
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
        <View style={styles.textBlock}>
          {title$}
          {desc &&
            !noTextDesc && <LText style={styles.description}>{desc}</LText>}
          {desc && noTextDesc && desc}
        </View>
        <View
          style={[styles.rightBlock, alignedTop && styles.rightBlockTopPadded]}
        >
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
  rightBlockTopPadded: {
    marginTop: 3,
  },
  rootCompact: {
    paddingVertical: 16,
  },
  textBlock: {
    paddingRight: 16,
    flexGrow: 1,
    flexShrink: 1,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpIcon: {
    marginLeft: 8,
  },
  titleStyle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.darkBlue,
  },
  description: {
    color: colors.grey,
    paddingTop: 5,
    fontSize: 14,
    lineHeight: 21,
  },
  iconRightContainer: {
    marginLeft: 4,
  },
  iconLeft: {
    paddingRight: 16,
  },
  iconLeftContainer: {
    marginRight: 8,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
  },
});
