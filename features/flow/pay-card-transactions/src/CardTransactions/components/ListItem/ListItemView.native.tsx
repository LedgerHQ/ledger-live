import React from "react";
import {
  ListItem as LumenListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { CategoryIcon } from "../CategoryIcon";
import type { ListItemViewProps } from "./ListItem.types";

export function ListItemView({
  id,
  merchant,
  category,
  categoryLabel,
  fiatAmount,
  assetAmount,
  dateLabel,
  onOpenTransaction,
}: ListItemViewProps) {
  return (
    <LumenListItem onPress={onOpenTransaction} testID={`card-transactions-item-${id}`}>
      <ListItemLeading>
        <CategoryIcon category={category} categoryLabel={categoryLabel} />
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
