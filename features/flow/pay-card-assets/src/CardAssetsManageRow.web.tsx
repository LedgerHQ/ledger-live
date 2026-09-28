import React, { type DragEventHandler } from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spinner,
} from "@ledgerhq/lumen-ui-react";
import { MenuBurger } from "@ledgerhq/lumen-ui-react/symbols";
import type { CardAssetRow } from "./types";

type CardAssetsManageRowProps = Readonly<{
  row: CardAssetRow;
  isReordering: boolean;
  isReorderDisabled: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDrop: () => void;
}>;

export function CardAssetsManageRow({
  row,
  isReordering,
  isReorderDisabled,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CardAssetsManageRowProps) {
  return (
    <div data-testid={`card-asset-order-${row.id}`} onDragOver={onDragOver} onDrop={onDrop}>
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
              draggable={!isReorderDisabled}
              disabled={isReorderDisabled}
              aria-label={`Drag ${row.name}`}
              className="cursor-grab text-muted active:cursor-grabbing"
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <MenuBurger size={24} />
            </button>
          )}
        </ListItemTrailing>
      </ListItem>
    </div>
  );
}
