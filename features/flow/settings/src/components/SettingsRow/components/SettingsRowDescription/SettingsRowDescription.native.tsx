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
        // The Lumen list item has a fixed height: past two lines the description is clipped.
        <ListItemDescription numberOfLines={2}>{description}</ListItemDescription>
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
