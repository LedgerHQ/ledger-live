import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  SearchInput,
} from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import type { SettingsOptionListViewProps } from "./SettingsOptionListView.types";

export function SettingsOptionListView({
  items,
  onSelectOption,
  search,
  emptyLabel,
  testID,
}: SettingsOptionListViewProps) {
  return (
    <div className="flex flex-col gap-16" data-testid={testID}>
      {search ? (
        <SearchInput
          value={search.query}
          placeholder={search.placeholder}
          aria-label={search.placeholder}
          onChange={event => search.onChangeQuery(event.target.value)}
          data-testid={testID && `${testID}-search`}
        />
      ) : null}
      {emptyLabel ? (
        <p className="body-2 text-muted">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col">
          {items.map(item => (
            <ListItem
              key={item.value}
              aria-pressed={item.isSelected}
              onClick={() => onSelectOption(item.value)}
              data-testid={testID && `${testID}-option-${item.value}`}
            >
              <ListItemLeading>
                {item.icon}
                <ListItemContent>
                  <ListItemTitle>{item.label}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
              <ListItemTrailing>
                {item.isSelected ? (
                  <Check size={20} className="text-active" />
                ) : item.trailingText ? (
                  <span className="body-2 text-muted">{item.trailingText}</span>
                ) : null}
              </ListItemTrailing>
            </ListItem>
          ))}
        </div>
      )}
    </div>
  );
}
