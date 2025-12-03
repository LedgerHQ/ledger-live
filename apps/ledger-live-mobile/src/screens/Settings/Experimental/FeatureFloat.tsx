import React, { useCallback, useState, useEffect, useRef } from "react";
import { TextInput, StyleSheet, Keyboard, Platform } from "react-native";
import { EnvName, getEnvDefault } from "@ledgerhq/live-env";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Box, Flex, Switch } from "@ledgerhq/native-ui";
import Track from "~/analytics/Track";
import getFontStyle from "~/components/LText/getFontStyle";

type Props = {
  name: EnvName;
  readOnly: boolean;
  onChange: (name: EnvName, val: unknown) => boolean;
  value: number;
  minValue?: number;
  maxValue?: number;
  isDefault: boolean;
};

const FeatureFloat = ({
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
  const inputRef = useRef<TextInput>(null);
  const constraintValue = useCallback(
    // @ts-expect-error supposed to be number | string but this means casting everywhere
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
    const listeners: ReturnType<typeof Keyboard.addListener>[] = [];
    if (Platform.OS === "android") {
      listeners.push(Keyboard.addListener("keyboardDidShow", onKeyboardShow));
      listeners.push(Keyboard.addListener("keyboardDidHide", onKeyboardHide));
    }

    return () => {
      if (Platform.OS === "android") {
        listeners.forEach(listener => listener.remove());
      }
    };
  }, [onKeyboardShow, onKeyboardHide]);

  useEffect(() => {
    if (!enabled) {
      setInputValue(String(constraintValue(value)));
    }
  }, [enabled, value, constraintValue]);

  const onInputChange = useCallback(
    (str: string) => {
      if (!enabled) return;
      const sanitized = str.replace(/[^0-9.]/g, "");
      setInputValue(sanitized);
      if (sanitized.length > 0) {
        const parsed = constraintValue(parseFloat(sanitized));
        onChange(name, parsed);
      }
    },
    [name, onChange, constraintValue, enabled],
  );

  const onEnableChange = useCallback(
    (e: boolean) => {
      setEnabled(!!e);
      if (e) {
        requestAnimationFrame(() => inputRef.current?.focus());
        onChange(name, constraintValue(value));
      } else {
        onChange(name, getEnvDefault(name));
        Keyboard.dismiss();
      }
    },
    [name, onChange, value, constraintValue, inputRef],
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
        {enabled && (
          <TextInput
            ref={inputRef}
            style={[{ color: colors.darkBlue }, { ...styles.input, borderColor: colors.lightFog }]}
            keyboardType="decimal-pad"
            value={inputValue}
            onChangeText={onInputChange}
            editable={true}
            autoFocus={false}
          />
        )}
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
});

export default FeatureFloat;
