// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "./Touchable";

import colors, { rgba } from "../colors";
import LText from "./LText";

const iconWrapperBg = rgba(colors.live, 0.1);

const hitSlop = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export default class BottomModalChoice extends PureComponent<{
  onPress: ?() => void,
  Icon: React$ComponentType<*>,
  title: string,
  description?: string,
  event: string,
  eventProperties?: Object,
}> {
  render() {
    const {
      Icon,
      title,
      description,
      onPress,
      event,
      eventProperties,
    } = this.props;
    return (
      <Touchable
        onPress={onPress}
        style={[styles.root, !onPress && styles.disabled]}
        hitSlop={hitSlop}
        event={event}
        eventProperties={eventProperties}
      >
        <View style={styles.left}>
          {Icon ? <IconWrapper Icon={Icon} /> : null}
        </View>
        <View style={styles.body}>
          <LText style={styles.title} semiBold>
            {title}
          </LText>
          {!!description && (
            <LText style={styles.description}>{description}</LText>
          )}
        </View>
      </Touchable>
    );
  }
}

class IconWrapper extends PureComponent<{ Icon: React$ComponentType<*> }> {
  render() {
    const { Icon } = this.props;
    return (
      <View style={styles.iconWrapper}>
        <Icon size={16} color={colors.live} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingVertical: 20,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.3,
  },
  left: {
    paddingLeft: 24,
    paddingRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flexGrow: 1,
  },
  title: {
    color: colors.smoke,
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: colors.grey,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    backgroundColor: iconWrapperBg,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
