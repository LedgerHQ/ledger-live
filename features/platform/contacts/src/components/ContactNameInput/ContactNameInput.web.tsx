import React from "react";
import { CONTACT_NAME_MAX_LENGTH } from "@domain/entity-contact";
import { TextInput } from "@ledgerhq/lumen-ui-react";

type ContactNameInputProps = Readonly<{
  value: string;
  placeholder: string;
  errorMessage?: string;
  isEditable?: boolean;
  /** Namespaces the test ids, so each host dialog identifies its own input. */
  testIDPrefix?: string;
  onChange: (value: string) => void;
}>;

export function ContactNameInput({
  value,
  placeholder,
  errorMessage,
  isEditable = true,
  testIDPrefix = "contacts-add-contact",
  onChange,
}: ContactNameInputProps): React.ReactNode {
  return (
    <TextInput
      data-testid={`${testIDPrefix}-name-input`}
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
