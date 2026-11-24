import React from "react";
import { Button, Switch } from "@ledgerhq/lumen-ui-react";
import { ChevronRight, ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { SettingsRowSelect } from "../SettingsRowSelect/SettingsRowSelect";
import type { SettingsRowTrailingProps } from "./SettingsRowTrailing.types";

export function SettingsRowTrailing({
  trailing,
  disabled,
  toggleTestID,
}: SettingsRowTrailingProps) {
  switch (trailing.type) {
    case "chevron":
      return <ChevronRight size={20} className="text-muted" />;
    case "externalLink":
      return <ExternalLink size={20} className="text-muted" />;
    case "toggle":
      return (
        <Switch
          selected={trailing.value}
          onChange={trailing.onToggle}
          disabled={disabled}
          data-testid={toggleTestID}
        />
      );
    case "value":
      return <span className="body-2 text-muted">{trailing.text}</span>;
    case "select":
      return <SettingsRowSelect trailing={trailing} disabled={disabled} />;
    case "button":
      return (
        <Button appearance="gray" size="sm" onClick={trailing.onSelect} disabled={disabled}>
          {trailing.label}
        </Button>
      );
  }
}
