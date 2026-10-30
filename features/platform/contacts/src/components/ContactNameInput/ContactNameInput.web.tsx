import React from "react";
import { CONTACT_NAME_MAX_LENGTH } from "@domain/entity-contact";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import type { ContactNameInputProps } from "./ContactNameInput.types";

export function ContactNameInput({
  value,
  placeholder,
  errorMessage,
  isEditable = true,
  testIDPrefix = "contacts-add-contact",
  onChangeName,
}: ContactNameInputProps): React.ReactNode {
  return (
    <TextInput
      data-testid={`${testIDPrefix}-name-input`}
      label={placeholder}
      value={value}
      onChange={event => onChangeName(event.target.value)}
      maxLength={CONTACT_NAME_MAX_LENGTH}
      maxCount={CONTACT_NAME_MAX_LENGTH}
      helperText={errorMessage}
      status={errorMessage ? "error" : undefined}
      readOnly={!isEditable}
      className="mt-2"
    />
  );
}
