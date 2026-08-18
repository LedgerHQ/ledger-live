import React from "react";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { CONTACT_NAME_MAX_LENGTH } from "./constants";

type ContactNameInputProps = Readonly<{
  value: string;
  placeholder: string;
  errorMessage?: string;
  isEditable?: boolean;
  onChange: (value: string) => void;
}>;

export function ContactNameInput({
  value,
  placeholder,
  errorMessage,
  isEditable = true,
  onChange,
}: ContactNameInputProps): React.ReactNode {
  return (
    <TextInput
      data-testid="contacts-add-contact-name-input"
      label={placeholder}
      value={value}
      onChange={event => onChange(event.target.value)}
      maxLength={CONTACT_NAME_MAX_LENGTH}
      maxCount={CONTACT_NAME_MAX_LENGTH}
      helperText={errorMessage}
      status={errorMessage ? "error" : undefined}
      readOnly={!isEditable}
      className="mt-2"
    />
  );
}
