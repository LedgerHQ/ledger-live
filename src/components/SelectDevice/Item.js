// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Touchable from "../Touchable";
import LText from "../LText";
import IconArrowRight from "../../icons/ArrowRight";
import Ellipsis from "../../icons/Ellipsis";

type Props = {
  event?: string,
  disabled?: boolean,
  withArrow?: boolean,
  icon?: React$Node,
  title?: React$Node,
  description?: React$Node,
  onPress?: () => any,
  onMore?: () => any,
  primary?: boolean,
  testID?: string,
};

function Item({
  event,
  icon,
  onPress,
  onMore,
  primary,
  disabled,
  title,
  description,
  withArrow,
  testID,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Touchable
          event={event}
          onPress={disabled ? undefined : onPress}
          testID={testID}
        >
          <View
            style={[
              styles.root,
              disabled && styles.disabled,
              disabled
                ? { backgroundColor: colors.card }
                : { borderColor: colors.fog },
            ]}
          >
            {icon && <View style={styles.iconWrapper}>{icon}</View>}
            <View style={styles.content}>
              <LText
                semiBold
                numberOfLines={1}
                color={disabled ? "grey" : primary ? "live" : "darkBlue"}
                style={[styles.titleText]}
              >
                {title}
              </LText>
              {description ? (
                <LText
                  numberOfLines={1}
                  color={disabled ? "grey" : primary ? "live" : "darkBlue"}
                  style={[styles.descriptionText]}
                >
                  {description}
                </LText>
              ) : null}
            </View>
            {!withArrow && onMore && (
              <Touchable event="ItemForget" onPress={onMore}>
                <Ellipsis color={colors.darkBlue} />
              </Touchable>
            )}
            {withArrow && !disabled ? (
              <IconArrowRight
                size={16}
                color={primary ? colors.live : colors.grey}
              />
            ) : null}
          </View>
        </Touchable>
      </View>
    </View>
  );
}

export default memo<Props>(Item);

const styles = StyleSheet.create({
  outer: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  inner: {
    flex: 1,
  },
  root: {
    height: 64,
    padding: 16,
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  disabled: {
    borderColor: "transparent",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 15,
    marginRight: 24,
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    flexBasis: "auto",
    flexShrink: 1,
    flexGrow: 1,
  },
  titleText: {
    fontSize: 16,
  },
  descriptionText: {
    fontSize: 14,
  },
});
