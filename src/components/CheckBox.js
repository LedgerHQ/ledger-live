// @flow

import React, { memo, useCallback } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";

import { useTheme } from "@react-navigation/native";
import IconCheck from "../icons/Check";

type Props = {
  isChecked: boolean,
  onChange?: boolean => void,
  disabled?: boolean,
  style?: *,
};

const checkBoxHitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

function CheckBox({ isChecked, disabled, onChange, style }: Props) {
  const { colors } = useTheme();
  const onPress = useCallback(() => {
    if (!onChange) return;
    onChange(!isChecked);
  }, [isChecked, onChange]);

  const body = (
    <IconCheck size={20} color={!isChecked ? "transparent" : "white"} />
  );

  const commonProps = {
    style: [
      styles.root,
      isChecked && { ...styles.rootChecked, backgroundColor: colors.live },
      { borderColor: colors.fog },
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
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 24,
  },
  rootChecked: {
    borderWidth: 2,
    borderColor: "transparent",
  },
});

export default memo<Props>(CheckBox);
