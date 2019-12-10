import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "../../../components/Touchable";
import LText from "../../../components/LText";
import colors from "../../../colors";
import ArrowRight from "../../../icons/ArrowRight";

export default class SettingsRow extends Component<{
  onPress: () => void,
  title: string,
  titleStyle?: *,
  arrowRight?: boolean,
  alignedTop?: boolean,
  iconLeft?: React$Node,
  top?: boolean,
  bottom?: boolean,
  compact?: boolean,
  children: React$Node,
}> {
  render() {
    const {
      onPress,
      children,
      title,
      titleStyle,
      arrowRight,
      alignedTop,
      top,
      bottom,
      compact,
      iconLeft,
    } = this.props;
    return (
      <Touchable
        onPress={onPress}
        style={[
          styles.root,
          top && styles.borderTop,
          bottom && styles.borderBottom,
          alignedTop && styles.rootAlignedTop,
          compact && styles.rootCompact,
        ]}
      >
        <View
          style={[
            styles.container,
            compact && styles.containerCompact,
            bottom && styles.cleanBottom,
          ]}
        >
          {iconLeft || null}
          <View style={styles.textBlock}>
            <LText semiBold style={[styles.titleStyle, titleStyle]}>
              {title}
            </LText>
          </View>
          <View style={styles.rightBlock}>
            {children}
            {arrowRight ? (
              <View style={styles.iconRightContainer}>
                <ArrowRight size={16} color={colors.grey} />
              </View>
            ) : null}
          </View>
        </View>
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    minHeight: 50,
    paddingLeft: 16,
    paddingTop: 24,
    backgroundColor: "white",
  },
  rootAlignedTop: {
    alignItems: "flex-start",
  },
  rootCompact: {
    paddingTop: 16,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 24,
    paddingBottom: 24,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
  },
  containerCompact: {
    paddingRight: 16,
    paddingBottom: 16,
  },
  cleanBottom: {
    borderBottomWidth: 0,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.fog,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.fog,
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
  iconRightContainer: {
    marginLeft: 4,
  },
});
