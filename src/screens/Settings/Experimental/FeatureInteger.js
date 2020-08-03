// @flow

import React, { useCallback, useState, useEffect } from "react";
import { Switch, TextInput, StyleSheet } from "react-native";
import { getEnvDefault } from "@ledgerhq/live-common/lib/env";
import { View } from "react-native-animatable";

import Track from "../../../analytics/Track";
import getFontStyle from "../../../components/LText/getFontStyle";
import colors from "../../../colors";

type Props = {
  name: *,
  isDefault: boolean,
  readOnly: boolean,
  onChange: (name: string, val: mixed) => boolean,
  value: number,
  minValue: number,
  maxValue: number,
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

  useEffect(() => {
    if (isDefault && !enabled) {
      setInputValue(String(constraintValue(value)));
    }
  }, [isDefault, enabled, value, setInputValue, constraintValue]);

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
        onChange(name, constraintValue(value));
      } else {
        onChange(name, getEnvDefault(name));
      }
    },
    [setEnabled, name, onChange, value, constraintValue],
  );

  return (
    <>
      <Track onUpdate event={enabled ? `${name}Enabled` : `${name}Disabled`} />
      <View style={styles.wrapper}>
        <Switch
          disabled={readOnly}
          value={enabled}
          onValueChange={readOnly ? null : onEnableChange}
          style={styles.switch}
        />
        {enabled ? (
          <TextInput
            autoFocus
            style={styles.input}
            keyboardType="numeric"
            value={enabled ? inputValue : ""}
            onChangeText={onInputChange}
          />
        ) : null}
      </View>
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
    textAlign: "center",
    fontSize: 20,
    ...getFontStyle({ semiBold: true }),
    borderWidth: 1,
    borderColor: colors.lightFog,
  },
});

export default FeatureInteger;
