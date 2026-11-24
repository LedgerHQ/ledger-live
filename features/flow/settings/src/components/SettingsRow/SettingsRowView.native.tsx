import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { SettingsRowDescription } from "./components/SettingsRowDescription/SettingsRowDescription";
import { SettingsRowTrailing } from "./components/SettingsRowTrailing/SettingsRowTrailing";
import type { SettingsRowViewProps } from "./SettingsRowView.types";

export function SettingsRowView({
  title,
  description,
  descriptionLink,
  icon,
  trailing,
  disabled,
  testID,
  onPress,
  toggleTestID,
}: SettingsRowViewProps) {
  return (
    <ListItem disabled={disabled} onPress={onPress} testID={testID}>
      <ListItemLeading>
        {icon}
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <SettingsRowDescription
            description={description}
            link={descriptionLink}
            disabled={disabled}
          />
        </ListItemContent>
      </ListItemLeading>
      {trailing ? (
        <ListItemTrailing>
          <SettingsRowTrailing
            trailing={trailing}
            disabled={disabled}
            toggleTestID={toggleTestID}
          />
        </ListItemTrailing>
      ) : null}
    </ListItem>
  );
}
