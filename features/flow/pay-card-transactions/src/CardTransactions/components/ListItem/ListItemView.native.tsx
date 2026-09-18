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
    <LumenListItem onPress={onPress} testID={`card-transactions-item-${id}`}>
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
