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
  onHelpPress?: () => void,
  title: React$Node,
  titleStyle?: *,
  titleContainerStyle?: *,
  desc?: React$Node,
  selected?: boolean,
  arrowRight?: boolean,
  iconLeft?: *,
  centeredIcon?: boolean,
  alignedTop?: boolean,
  compact?: boolean,
  children: React$Node,
  borderTop?: boolean,
  noTextDesc?: boolean,
  event?: string,
  eventProperties?: Object,
}> {
  render() {
    const {
      onPress,
      onHelpPress,
      children,
      title,
      titleStyle,
      titleContainerStyle,
      desc,
      arrowRight,
      iconLeft,
      centeredIcon,
      alignedTop,
      compact,
      selected,
      borderTop,
      noTextDesc,
      event,
      eventProperties,
    } = this.props;

    let title$ = (
      <View style={[styles.titleContainer, titleContainerStyle]}>
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
        event={event}
        eventProperties={eventProperties}
      >
        {iconLeft && (
          <View style={[styles.iconLeft, centeredIcon && styles.centeredIcon]}>
            {iconLeft}
          </View>
        )}
        <View style={[styles.textBlock, { marginLeft: iconLeft ? 0 : 16 }]}>
          {title$}
          {desc && !noTextDesc && (
            <LText style={styles.description}>{desc}</LText>
          )}
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
    paddingVertical: 24,
    backgroundColor: "white",
    marginBottom: 2,
    justifyContent: "space-between",
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
    marginRight: "auto",
    paddingRight: 16,
    flexShrink: 1,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
    maxWidth: "50%",
    marginRight: 16,
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
    marginLeft: 16,
  },
  centeredIcon: {
    justifyContent: "center",
  },
  iconLeftContainer: {
    marginRight: 8,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
  },
});
