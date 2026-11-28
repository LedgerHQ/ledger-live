import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
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
    <ListItem
      disabled={disabled}
      onClick={onPress}
      className="h-auto min-h-64 py-12"
      data-testid={testID}
    >
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
            rowTitle={title}
            disabled={disabled}
            toggleTestID={toggleTestID}
          />
        </ListItemTrailing>
      ) : null}
    </ListItem>
  );
}
