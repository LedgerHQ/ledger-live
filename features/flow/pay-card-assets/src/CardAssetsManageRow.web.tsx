import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spinner,
} from "@ledgerhq/lumen-ui-react";
import { MenuBurger } from "@ledgerhq/lumen-ui-react/symbols";
import type { ListReorderBindings } from "@shared/ui-list-reorder";
import type { CardAssetRow } from "./types";

type CardAssetsManageRowProps = Readonly<{
  row: CardAssetRow;
  isReordering: boolean;
  isReorderDisabled: boolean;
  rowProps: ReturnType<ListReorderBindings["getRowProps"]>;
  handleProps: ReturnType<ListReorderBindings["getHandleProps"]>;
  reorderLabel: string;
}>;

export function CardAssetsManageRow({
  row,
  isReordering,
  isReorderDisabled,
  rowProps,
  handleProps,
  reorderLabel,
}: CardAssetsManageRowProps) {
  return (
    <div data-testid={`card-asset-order-${row.id}`} {...rowProps}>
      <ListItem className="bg-surface">
        <ListItemLeading>
          <ListItemContent>
            <ListItemTitle className="body-2-semi-bold">{row.name}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          {isReordering ? (
            <Spinner size={24} data-testid={`card-asset-reorder-spinner-${row.id}`} />
          ) : (
            <button
              type="button"
              disabled={isReorderDisabled}
              aria-label={reorderLabel}
              className="cursor-grab text-muted active:cursor-grabbing"
              {...handleProps}
            >
              <MenuBurger size={24} />
            </button>
          )}
        </ListItemTrailing>
      </ListItem>
    </div>
  );
}
