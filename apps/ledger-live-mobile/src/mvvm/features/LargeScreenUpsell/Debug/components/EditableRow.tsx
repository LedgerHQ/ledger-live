import React, { useEffect, useState } from "react";
import type { KeyboardTypeOptions } from "react-native";
import { Box, Button, TextInput } from "@ledgerhq/lumen-ui-rnative";

interface EditableRowProps {
  label: string;
  initialValue: string;
  onApply: (value: string) => string | undefined;
  description?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  actionLabel?: string;
  onAction?: () => void;
}

export const EditableRow = ({
  label,
  initialValue,
  onApply,
  description,
  placeholder,
  keyboardType,
  actionLabel,
  onAction,
}: EditableRowProps) => {
  const [text, setText] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setText(initialValue);
    setError(undefined);
  }, [initialValue]);

  return (
    <Box lx={{ gap: "s8", marginBottom: "s16" }}>
      <TextInput
        label={label}
        value={text}
        onChangeText={value => {
          setText(value);
          setError(undefined);
        }}
        placeholder={placeholder}
        helperText={error ?? description}
        status={error ? "error" : undefined}
        keyboardType={keyboardType}
        autoComplete="off"
      />
      <Box lx={{ flexDirection: "row", gap: "s8" }}>
        <Button size="sm" appearance="base" onPress={() => setError(onApply(text))}>
          Apply
        </Button>
        {actionLabel && onAction ? (
          <Button size="sm" appearance="gray" onPress={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
};
