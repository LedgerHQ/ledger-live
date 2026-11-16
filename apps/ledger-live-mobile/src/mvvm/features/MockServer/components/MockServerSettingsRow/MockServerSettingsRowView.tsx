import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, Servers } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { MockServerSettingsRowViewModel } from "./useMockServerSettingsRowViewModel";

export function MockServerSettingsRowView({
  isEnabled,
  onPress,
}: Readonly<MockServerSettingsRowViewModel>) {
  return (
    <Box lx={{ paddingHorizontal: "s16" }}>
      <ListItem onPress={onPress}>
        <ListItemLeading>
          <Spot size={48} icon={Servers} />
          <ListItemContent>
            <ListItemTitle>Mock server</ListItemTitle>
            <ListItemDescription>
              {isEnabled ? "On: manage the session" : "Replace physical devices with mock ones"}
            </ListItemDescription>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ChevronRight size={24} />
        </ListItemTrailing>
      </ListItem>
    </Box>
  );
}
