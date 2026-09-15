import React from "react";
import {
  ListItem as LumenListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { useCategoryVisual } from "./useCategoryVisual";
import type { ListItemViewProps } from "./types";

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
  const { Icon, backgroundStyle } = useCategoryVisual(category);

  return (
    <LumenListItem data-testid={`card-transactions-item-${id}`} onClick={onPress}>
      <ListItemLeading>
        <div
          className="flex size-48 shrink-0 items-center justify-center rounded-full bg-(--category-bg) text-white dark:bg-(--category-bg-dark) dark:text-black"
          style={backgroundStyle}
        >
          <Icon aria-hidden size={24} />
          <span className="sr-only">{categoryLabel}</span>
        </div>
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
