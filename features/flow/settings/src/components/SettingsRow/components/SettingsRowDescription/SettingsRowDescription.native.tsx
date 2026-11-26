import React from "react";
import { Link, ListItemDescription } from "@ledgerhq/lumen-ui-rnative";
import type { SettingsRowDescriptionProps } from "./SettingsRowDescription.types";

export function SettingsRowDescription({
  description,
  link,
  disabled = false,
}: SettingsRowDescriptionProps) {
  return (
    <>
      {description ? (
        // Lumen cuts descriptions to one line by default; the design wraps them, so 0 lifts the limit.
        <ListItemDescription numberOfLines={0}>{description}</ListItemDescription>
      ) : null}
      {link ? (
        <Link
          size="sm"
          underline
          onPress={disabled ? undefined : link.onSelect}
          accessibilityState={{ disabled }}
        >
          {link.label}
        </Link>
      ) : null}
    </>
  );
}
