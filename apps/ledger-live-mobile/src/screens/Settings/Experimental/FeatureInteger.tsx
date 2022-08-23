import React, { useCallback, useState, useEffect, useRef } from "react";
import { TextInput, StyleSheet, Keyboard, Platform } from "react-native";
import { getEnvDefault } from "@ledgerhq/live-common/env";
import { useNavigation, useTheme } from "@react-navigation/native";

import { Box, Flex, Switch } from "@ledgerhq/native-ui";
import Track from "../../../analytics/Track";
import getFontStyle from "../../../components/LText/getFontStyle";

type Props = {
  name: any;
  readOnly: boolean;
  onChange: (name: string, val: any) => boolean;
  value: number;
  minValue: number;
  maxValue: number;
  isDefault: boolean;
};

const FeatureInteger = ({
  name,
  isDefault,
  readOnly,
  onChange,
  value,
  minValue,
  maxValue,
}: Props) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const inputRef = useRef(null);
  const constraintValue = useCallback(
    v => {
      let value = v;
      if (typeof maxValue === "number" && parseInt(value, 10) > maxValue) {
        value = maxValue;
      }
      if (typeof minValue === "number" && parseInt(value, 10) < minValue) {
        value = minValue;
      }

      if (!value) {
        value = maxValue || minValue;
      }

      return value;
    },
    [minValue, maxValue],
  );

  const [enabled, setEnabled] = useState(!isDefault);
  const [inputValue, setInputValue] = useState(String(constraintValue(value)));

  const onKeyboardShow = useCallback(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
  }, [navigation]);
  const onKeyboardHide = useCallback(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "flex" } });
  }, [navigation]);

  useEffect(() => {
    if (Platform.OS === "android") {
      Keyboard.addListener("keyboardDidShow", onKeyboardShow);
      Keyboard.addListener("keyboardDidHide", onKeyboardHide);
    }

    return () => {
      if (Platform.OS === "android") {
        // Deprecated: https://reactnative.dev/docs/keyboard#removelistener
        // @ts-ignore
        Keyboard.removeListener("keyboardDidShow", onKeyboardShow);
        // @ts-ignore
        Keyboard.removeListener("keyboardDidHide", onKeyboardHide);
      }
    };
  }, [onKeyboardShow, onKeyboardHide]);

  useEffect(() => {
    if (!enabled) {
      setInputValue(String(constraintValue(value)));
    }
  }, [enabled, value, setInputValue, constraintValue]);

  const onInputChange = useCallback(
    str => {
      if (!enabled) return;
      const sanitized = str.replace(/[^0-9]/g, "");
      if (sanitized.length > 0) {
        const parsed = constraintValue(parseInt(sanitized, 10));
        onChange(name, parsed);
      }
      setInputValue(sanitized);
    },
    [name, onChange, constraintValue, enabled],
  );

  const onEnableChange = useCallback(
    e => {
      setEnabled(!!e);
      if (e) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 16);
        onChange(name, constraintValue(value));
      } else {
        onChange(name, getEnvDefault(name));
        Keyboard.dismiss();
      }
    },
    [setEnabled, name, onChange, value, constraintValue, inputRef],
  );

  return (
    <>
      <Track onUpdate event={enabled ? `${name}Enabled` : `${name}Disabled`} />
      <Flex flexDirection={"column"}>
        <Box mb={6}>
          <Switch
            disabled={readOnly}
            checked={enabled}
            onChange={readOnly ? undefined : onEnableChange}
          />
        </Box>
        <TextInput
          ref={inputRef}
          style={[
            { color: colors.darkBlue },
            enabled
              ? { ...styles.input, borderColor: colors.lightFog }
              : styles.inputHidden,
          ]}
          keyboardType="numeric"
          value={enabled ? inputValue : ""}
          onChangeText={onInputChange}
        />
      </Flex>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "column",
  },
  switch: {
    marginBottom: 16,
  },
  input: {
    paddingVertical: 12,
    marginBottom: 12,
    textAlign: "center",
    fontSize: 20,
    ...getFontStyle({ semiBold: true }),
    borderWidth: 1,
  },
  inputHidden: {
    display: "none",
  },
});

export default FeatureInteger;
