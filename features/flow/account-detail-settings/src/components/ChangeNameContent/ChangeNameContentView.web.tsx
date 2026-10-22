import React from "react";
import { Button, TextInput } from "@ledgerhq/lumen-ui-react";
import type { ChangeNameContentViewProps } from "./types.web";

export function ChangeNameContentView({
  value,
  maxLength,
  label,
  submitLabel,
  isSubmitDisabled,
  onChange,
  onClear,
  onSubmit,
}: ChangeNameContentViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="account-settings-change-name-content">
      <TextInput
        className="pt-2"
        label={label}
        value={value}
        maxLength={maxLength}
        onChange={event => onChange(event.target.value)}
        onClear={onClear}
        onKeyDown={event => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          event.preventDefault();
          onSubmit();
        }}
        autoFocus
        data-testid="account-settings-change-name-input"
      />
      <Button
        type="button"
        onClick={onSubmit}
        appearance="base"
        size="lg"
        isFull
        disabled={isSubmitDisabled}
        data-testid="account-settings-change-name-submit"
      >
        {submitLabel}
      </Button>
    </div>
  );
}
