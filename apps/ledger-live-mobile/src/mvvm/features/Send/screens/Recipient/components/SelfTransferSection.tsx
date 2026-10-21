import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, UserCheck, UserLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSelfTransferSectionViewModel } from "../hooks/useSelfTransferSectionViewModel";

export function SelfTransferSection() {
  const viewModel = useSelfTransferSectionViewModel();

  if (!viewModel) return null;

  const icon = viewModel.target.isDestinationPublic ? UserCheck : UserLock;

  return (
    <Box
      lx={{ marginHorizontal: "s8", marginBottom: "s16", gap: "s8" }}
      testID="self-transfer-section"
    >
      <Text typography="body2SemiBold" lx={{ color: "muted" }}>
        {viewModel.title}
      </Text>
      <ListItem onPress={viewModel.onSelfTransfer} testID="self-transfer-button">
        <ListItemLeading>
          <Spot appearance="icon" icon={icon} />
          <ListItemContent>
            <ListItemTitle>{viewModel.actionLabel}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ChevronRight size={24} />
        </ListItemTrailing>
      </ListItem>
    </Box>
  );
}
