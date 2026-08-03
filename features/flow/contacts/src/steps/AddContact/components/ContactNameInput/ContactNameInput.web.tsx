import React from "react";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { CONTACT_NAME_MAX_LENGTH } from "../../model/constants";

type ContactNameInputProps = Readonly<{
  value: string;
  placeholder: string;
  errorMessage?: string;
  onChange: (value: string) => void;
}>;

export function ContactNameInput({
  value,
  placeholder,
  errorMessage,
  onChange,
}: ContactNameInputProps): React.ReactNode {
  return (
    <TextInput
      data-testid="contacts-add-contact-name-input"
      label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      maxLength={CONTACT_NAME_MAX_LENGTH}
      maxCount={CONTACT_NAME_MAX_LENGTH}
      helperText={errorMessage}
      status={errorMessage ? "error" : undefined}
      className="mt-2"
    />
  );
}
