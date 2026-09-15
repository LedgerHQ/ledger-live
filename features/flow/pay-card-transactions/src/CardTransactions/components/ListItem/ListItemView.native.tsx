import React from "react";
import {
  Box,
  ListItem as LumenListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { useCategoryVisual } from "./useCategoryVisual";
import type { ListItemViewProps } from "./types";

const CATEGORY_ICON_SIZE = 24;

export function ListItemView({
  id,
  merchant,
  category,
  categoryLabel,
  fiatAmount,
  assetAmount,
  dateLabel,
  onPress,
}: ListItemViewProps) {
  const { Icon, backgroundColor, iconColor } = useCategoryVisual(category);

  return (
    <LumenListItem onPress={onPress} testID={`card-transactions-item-${id}`}>
      <ListItemLeading>
        <Box
          accessibilityLabel={categoryLabel}
          lx={{
            width: "s48",
            height: "s48",
            borderRadius: "full",
            alignItems: "center",
            justifyContent: "center",
          }}
          style={{ backgroundColor }}
        >
          <Icon size={CATEGORY_ICON_SIZE} color={iconColor} />
        </Box>
        <ListItemContent>
          <ListItemTitle>{merchant}</ListItemTitle>
          <ListItemDescription>{dateLabel}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent lx={{ alignItems: "flex-end" }}>
          <ListItemTitle>{fiatAmount}</ListItemTitle>
          {assetAmount ? <ListItemDescription>{assetAmount}</ListItemDescription> : null}
        </ListItemContent>
      </ListItemTrailing>
    </LumenListItem>
  );
}
