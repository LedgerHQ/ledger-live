import React from "react";
import { TextInput } from "@ledgerhq/lumen-ui-react";

type DevLabeledInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export const DevLabeledInput = ({ label, value, onChange, readOnly }: DevLabeledInputProps) => (
  <TextInput
    label={label}
    aria-label={label}
    value={value}
    readOnly={readOnly}
    disabled={readOnly}
    onChange={readOnly ? undefined : event => onChange(event.target.value)}
  />
);
