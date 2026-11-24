import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  SearchInput,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Check } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { SettingsOptionListViewProps } from "./SettingsOptionListView.types";

export function SettingsOptionListView({
  items,
  onSelectOption,
  search,
  emptyLabel,
  testID,
}: SettingsOptionListViewProps) {
  return (
    <Box lx={{ gap: "s16" }} testID={testID}>
      {search ? (
        <SearchInput
          value={search.query}
          placeholder={search.placeholder}
          accessibilityLabel={search.placeholder}
          onChangeText={search.onChangeQuery}
          testID={testID && `${testID}-search`}
        />
      ) : null}
      {emptyLabel ? (
        <Text typography="body2" lx={{ color: "muted" }}>
          {emptyLabel}
        </Text>
      ) : (
        <Box>
          {items.map(item => (
            <ListItem
              key={item.value}
              onPress={() => onSelectOption(item.value)}
              accessibilityState={{ selected: item.isSelected }}
              testID={testID && `${testID}-option-${item.value}`}
            >
              <ListItemLeading>
                {item.icon}
                <ListItemContent>
                  <ListItemTitle>{item.label}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
              <ListItemTrailing>
                {item.isSelected ? (
                  <Check size={24} color="active" />
                ) : item.trailingText ? (
                  <Text typography="body2" lx={{ color: "muted" }}>
                    {item.trailingText}
                  </Text>
                ) : null}
              </ListItemTrailing>
            </ListItem>
          ))}
        </Box>
      )}
    </Box>
  );
}
