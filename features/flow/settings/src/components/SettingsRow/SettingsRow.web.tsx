import React, { useCallback, type MouseEvent } from "react";
import {
  Button,
  Link,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  MediaButton,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
  Switch,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { useIsSettingHidden } from "../HiddenSettingsProvider/HiddenSettingsProvider";
import type { SettingsRowProps, SettingsRowTrailing } from "./SettingsRow.types";

type TrailingProps = Readonly<{
  trailing: SettingsRowTrailing;
  disabled?: boolean;
  testID?: string;
}>;

function SelectTrailing({
  trailing,
  disabled,
}: Readonly<{ trailing: Extract<SettingsRowTrailing, { type: "select" }>; disabled?: boolean }>) {
  const { value, options, onSelectOption } = trailing;
  const onValueChange = useCallback(
    (selected: string | null) => {
      if (selected !== null) onSelectOption(selected);
    },
    [onSelectOption],
  );
  const selectedLabel = options.find(option => option.value === value)?.label;

  return (
    <Select items={[...options]} value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        render={() => (
          <MediaButton appearance="gray" size="sm" disabled={disabled}>
            {selectedLabel}
          </MediaButton>
        )}
      />
      <SelectContent>
        <SelectList
          renderItem={item => (
            <SelectItem key={item.value} value={item.value}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </SelectContent>
    </Select>
  );
}

function Trailing({ trailing, disabled, testID }: TrailingProps) {
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
          data-testid={testID && `${testID}-toggle`}
        />
      );
    case "value":
      return <span className="body-2 text-muted">{trailing.text}</span>;
    case "select":
      return <SelectTrailing trailing={trailing} disabled={disabled} />;
    case "button":
      return (
        <Button appearance="gray" size="sm" onClick={trailing.onSelect} disabled={disabled}>
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
  const isRowPressable = trailing?.type === "chevron" || trailing?.type === "externalLink";
  const onRowClick = isRowPressable && !disabled ? trailing.onSelect : undefined;
  const onDescriptionLinkClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      descriptionLink?.onSelect();
    },
    [descriptionLink],
  );

  if (isHidden) return null;

  return (
    <ListItem
      disabled={disabled}
      onClick={onRowClick}
      className="h-auto py-12"
      data-testid={testID}
    >
      <ListItemLeading>
        {icon}
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          {description ? (
            <ListItemDescription className="whitespace-normal">{description}</ListItemDescription>
          ) : null}
          {descriptionLink ? (
            <Link asChild size="sm" underline disabled={disabled}>
              <button type="button" onClick={onDescriptionLinkClick} disabled={disabled}>
                {descriptionLink.label}
              </button>
            </Link>
          ) : null}
        </ListItemContent>
      </ListItemLeading>
      {trailing ? (
        <ListItemTrailing>
          <Trailing trailing={trailing} disabled={disabled} testID={testID} />
        </ListItemTrailing>
      ) : null}
    </ListItem>
  );
}
