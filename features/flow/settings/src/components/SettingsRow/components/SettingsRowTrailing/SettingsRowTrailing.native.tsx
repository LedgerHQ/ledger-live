import React from "react";
import { Box, Button, Pressable, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
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
      return <ChevronRight size={24} color="muted" />;
    case "externalLink":
      return <ExternalLink size={24} color="muted" />;
    case "toggle":
      return (
        <Switch
          checked={trailing.value}
          onCheckedChange={trailing.onToggle}
          disabled={disabled}
          accessibilityLabel={rowTitle}
          testID={toggleTestID}
        />
      );
    case "value":
      return (
        <Text typography="body2" lx={{ color: "muted" }}>
          {trailing.text}
        </Text>
      );
    case "select":
      return <SettingsRowSelect trailing={trailing} rowTitle={rowTitle} disabled={disabled} />;
    case "button":
      return (
        <Button appearance="gray" size="sm" onPress={trailing.onSelect} disabled={disabled}>
          {trailing.label}
        </Button>
      );
    case "picker":
      return (
        <Pressable
          onPress={trailing.onSelect}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={rowTitle}
          accessibilityValue={{ text: trailing.label }}
        >
          <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
            <Text typography="body2" lx={{ color: "muted" }}>
              {trailing.label}
            </Text>
            <ChevronRight size={24} color="muted" />
          </Box>
        </Pressable>
      );
  }
}
