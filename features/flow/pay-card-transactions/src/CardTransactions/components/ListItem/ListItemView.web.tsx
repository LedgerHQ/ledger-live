import React from "react";
import {
  ListItem as LumenListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
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
    <LumenListItem data-testid={`card-transactions-item-${id}`} onClick={onOpenTransaction}>
      <ListItemLeading>
        <CategoryIcon category={category} categoryLabel={categoryLabel} />
        <ListItemContent>
          <ListItemTitle>{merchant}</ListItemTitle>
          <ListItemDescription>{dateLabel}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          <ListItemTitle>{fiatAmount}</ListItemTitle>
          {assetAmount ? <ListItemDescription>{assetAmount}</ListItemDescription> : null}
        </ListItemContent>
      </ListItemTrailing>
    </LumenListItem>
  );
}
