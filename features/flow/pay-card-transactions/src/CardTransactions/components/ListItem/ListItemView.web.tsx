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
import type { ListItemViewProps } from "./types";

export function ListItemView({
  id,
  merchant,
  category,
  categoryLabel,
  fiatAmount,
  assetAmount,
  valueLabel,
  dateLabel,
  onPress,
}: ListItemViewProps) {
  return (
    <LumenListItem data-testid={`card-transactions-item-${id}`} onClick={onPress}>
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
          {assetAmount ? (
            <ListItemDescription>
              {valueLabel ? `${valueLabel} · ${assetAmount}` : assetAmount}
            </ListItemDescription>
          ) : null}
        </ListItemContent>
      </ListItemTrailing>
    </LumenListItem>
  );
}
