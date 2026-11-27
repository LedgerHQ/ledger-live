import React from "react";
import { Button, MediaButton, Switch } from "@ledgerhq/lumen-ui-react";
import { ChevronRight, ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { SettingsRowSelect } from "../SettingsRowSelect/SettingsRowSelect";
import type { SettingsRowTrailingProps } from "./SettingsRowTrailing.types";

export function SettingsRowTrailing({
  trailing,
  rowTitle,
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
          aria-label={rowTitle}
          data-testid={toggleTestID}
        />
      );
    case "value":
      return <span className="body-2 text-muted">{trailing.text}</span>;
    case "select":
      return <SettingsRowSelect trailing={trailing} rowTitle={rowTitle} disabled={disabled} />;
    case "button":
      return (
        <Button appearance="gray" size="sm" onClick={trailing.onSelect} disabled={disabled}>
          {trailing.label}
        </Button>
      );
    case "picker":
      return (
        <MediaButton
          appearance="gray"
          size="sm"
          onClick={trailing.onSelect}
          disabled={disabled}
          aria-label={`${rowTitle}, ${trailing.label}`}
        >
          {trailing.label}
        </MediaButton>
      );
  }
}
