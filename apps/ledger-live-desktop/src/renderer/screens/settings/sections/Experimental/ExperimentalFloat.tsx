import React, { useCallback, useState, useEffect } from "react";
import { EnvName, getEnvDefault } from "@ledgerhq/live-env";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";
import Input from "~/renderer/components/Input";
import Box from "~/renderer/components/Box";

type Props = {
  name: EnvName;
  isDefault: boolean;
  readOnly: boolean;
  onChange: (name: EnvName, val: unknown) => void;
  value: number;
  minValue?: number;
  maxValue?: number;
};

const ExperimentalFloat = ({
  name,
  isDefault,
  readOnly,
  onChange,
  value,
  minValue,
  maxValue,
}: Props) => {
  const constraintValue = useCallback(
    (v: number) => {
      let value = v;
      if (typeof maxValue === "number" && value > maxValue) value = maxValue;
      if (typeof minValue === "number" && value < minValue) value = minValue;
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
    (str: string) => {
      if (!enabled) return;
      const sanitized = str.replace(/[^0-9.]/g, "");
      if (sanitized.length > 0) {
        const parsed = constraintValue(parseFloat(sanitized));
        onChange(name, parsed);
      }
      setInputValue(sanitized);
    },
    [name, onChange, constraintValue, enabled],
  );
  const onEnableChange = useCallback(
    (e: boolean) => {
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

      <Box grow horizontal flow={2} alignItems="center">
        {enabled ? (
          <Input
            style={{
              maxWidth: 100,
            }}
            disabled={!enabled}
            value={enabled ? inputValue : ""}
            onChange={onInputChange}
          />
        ) : null}

        <Box
          style={{
            width: 100,
          }}
        />

        <Switch
          disabled={readOnly}
          isChecked={enabled}
          onChange={readOnly ? undefined : onEnableChange}
        />
      </Box>
    </>
  );
};
export default ExperimentalFloat;
