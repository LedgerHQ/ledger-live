import React from "react";
import {
  Button,
  Link,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Switch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronDown, ChevronRight, ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useIsSettingHidden } from "../HiddenSettingsProvider/HiddenSettingsProvider";
import type { SettingsRowProps, SettingsRowTrailing } from "./SettingsRow.types";

type TrailingProps = Readonly<{ trailing: SettingsRowTrailing; disabled?: boolean }>;

function Trailing({ trailing, disabled }: TrailingProps) {
  switch (trailing.type) {
    case "chevron":
      return <ChevronRight size={24} color="muted" />;
    case "externalLink":
      return <ExternalLink size={24} color="muted" />;
    case "toggle":
      return (
        <Switch checked={trailing.value} onCheckedChange={trailing.onToggle} disabled={disabled} />
      );
    case "value":
      return (
        <Text typography="body2" lx={{ color: "muted" }}>
          {trailing.text}
        </Text>
      );
    case "select":
      return (
        <>
          <Text typography="body2" lx={{ color: "muted" }}>
            {trailing.options.find(option => option.value === trailing.value)?.label}
          </Text>
          <ChevronDown size={20} color="muted" />
        </>
      );
    case "button":
      return (
        <Button appearance="gray" size="sm" onPress={trailing.onSelect} disabled={disabled}>
          {trailing.label}
        </Button>
      );
  }
}

export function SettingsRow({
  title,
  description,
  descriptionLink,
  icon,
  trailing,
  settingId,
  disabled,
  testID,
}: SettingsRowProps) {
  const isHidden = useIsSettingHidden(settingId);
  if (isHidden) return null;

  const isRowPressable = trailing?.type === "chevron" || trailing?.type === "externalLink";

  return (
    <ListItem
      disabled={disabled}
      onPress={isRowPressable ? trailing.onSelect : undefined}
      testID={testID}
    >
      <ListItemLeading>
        {icon}
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          {description ? <ListItemDescription>{description}</ListItemDescription> : null}
          {descriptionLink ? (
            <Link size="sm" underline onPress={descriptionLink.onSelect}>
              {descriptionLink.label}
            </Link>
          ) : null}
        </ListItemContent>
      </ListItemLeading>
      {trailing ? (
        <ListItemTrailing>
          <Trailing trailing={trailing} disabled={disabled} />
        </ListItemTrailing>
      ) : null}
    </ListItem>
  );
}
