// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Touchable from "./Touchable";

import { rgba } from "../colors";
import LText from "./LText";

const hitSlop = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

type Props = {
  onPress: ?() => any,
  Icon: React$ComponentType<*>,
  title: string,
  description?: string,
  event: string,
  eventProperties?: Object,
};

function BottomModalChoice({
  Icon,
  title,
  description,
  onPress,
  event,
  eventProperties,
}: Props) {
  const { colors } = useTheme();

  return (
    <Touchable
      onPress={onPress}
      style={[styles.root, !onPress && styles.disabled]}
      hitSlop={hitSlop}
      event={event}
      eventProperties={eventProperties}
    >
      <View style={styles.left}>
        {Icon ? <IconWrapper Icon={Icon} color={colors.live} /> : null}
      </View>
      <View style={styles.body}>
        <LText style={styles.title} semiBold color="smoke">
          {title}
        </LText>
        {!!description && (
          <LText style={styles.description} color="grey">
            {description}
          </LText>
        )}
      </View>
    </Touchable>
  );
}

export default memo<Props>(BottomModalChoice);

function IconWrapper({
  Icon,
  color,
}: {
  Icon: React$ComponentType<*>,
  color: string,
}) {
  const iconWrapperBg = rgba(color, 0.1);
  return (
    <View style={[styles.iconWrapper, { backgroundColor: iconWrapperBg }]}>
      <Icon size={16} color={color} />
    </View>
  );
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
    fontSize: 16,
  },
  description: {
    fontSize: 14,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
