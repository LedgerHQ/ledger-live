// @flow

import React, { memo, useCallback } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";

import { useTheme } from "@react-navigation/native";
import IconCheck from "../icons/Check";

type Props = {
  isChecked: boolean,
  onChange?: boolean => void,
  disabled?: boolean,
  iconCheckSize?: number,
  style?: *,
};

const checkBoxHitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

function CheckBox({
  isChecked,
  disabled,
  onChange,
  iconCheckSize = 16,
  style,
}: Props) {
  const { colors } = useTheme();
  const onPress = useCallback(() => {
    if (!onChange) return;
    onChange(!isChecked);
  }, [isChecked, onChange]);

  const body = (
    <IconCheck
      size={iconCheckSize}
      color={!isChecked ? "transparent" : "white"}
    />
  );

  const commonProps = {
    style: [
      styles.root,
      { borderColor: colors.fog, backgroundColor: colors.background },
      isChecked && {
        ...styles.rootChecked,
        backgroundColor: colors.live,
        borderColor: "transparent",
      },
      style,
    ],
  };

  if (onChange && !disabled) {
    return (
      <TouchableOpacity
        {...commonProps}
        onPress={onPress}
        hitSlop={checkBoxHitSlop}
      >
        {isChecked ? body : null}
      </TouchableOpacity>
    );
  }

  return <View {...commonProps}>{body}</View>;
}

const styles = StyleSheet.create({
  root: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 24,
  },
  rootChecked: {
    borderWidth: 1,
    borderColor: "transparent",
  },
});

export default memo<Props>(CheckBox);
