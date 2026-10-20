import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, PenEditWriting, Shapes, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { AccountSettingsMenuViewProps } from "./types";

export function AccountSettingsMenuView({
  accountName,
  labels,
  onChangeName,
  onViewAdvancedLogs,
  onRemoveAccount,
}: AccountSettingsMenuViewProps) {
  return (
    <Box lx={{ marginHorizontal: "-s8" }} testID="account-settings-menu">
      <ListItem priority="start" onPress={onChangeName} testID="account-settings-change-name">
        <ListItemLeading>
          <PenEditWriting size={20} />
          <ListItemContent>
            <ListItemTitle>{labels.changeName}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
          <Text
            typography="body2SemiBold"
            lx={{ color: "muted", flexShrink: 1 }}
            numberOfLines={1}
            testID="account-settings-change-name-value"
          >
            {accountName}
          </Text>
          <ChevronRight size={16} color="muted" />
        </ListItemTrailing>
      </ListItem>
      <ListItem onPress={onViewAdvancedLogs} testID="account-settings-advanced-logs">
        <ListItemLeading>
          <Shapes size={20} />
          <ListItemContent>
            <ListItemTitle>{labels.viewAdvancedLogs}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ChevronRight size={16} color="muted" />
        </ListItemTrailing>
      </ListItem>
      <ListItem onPress={onRemoveAccount} testID="account-settings-remove-account">
        <ListItemLeading>
          <Trash size={20} color="error" />
          <ListItemContent>
            <ListItemTitle lx={{ color: "error" }}>{labels.removeAccount}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ChevronRight size={16} color="muted" />
        </ListItemTrailing>
      </ListItem>
    </Box>
  );
}
