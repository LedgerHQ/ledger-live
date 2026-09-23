import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  showHandle: boolean;
  isReordering: boolean;
  reorderLabel: string;
}>;

export function CardAssetsManageRow({
  row,
  showHandle,
  isReordering,
  reorderLabel,
}: CardAssetsManageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: isReordering,
  });

  return (
    <div
      ref={setNodeRef}
      data-testid={`card-asset-order-${row.id}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1 : undefined,
      }}
    >
      <ListItem className="bg-surface">
        <ListItemLeading>
          <ListItemContent>
            <ListItemTitle className="body-2-semi-bold">{row.name}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        {showHandle ? (
          <ListItemTrailing>
            {isReordering ? (
              <Spinner size={24} data-testid={`card-asset-reorder-spinner-${row.id}`} />
            ) : (
              <button
                type="button"
                aria-label={reorderLabel}
                className="cursor-grab text-muted active:cursor-grabbing"
                data-testid={`card-asset-reorder-handle-${row.id}`}
                {...attributes}
                {...listeners}
              >
                <MenuBurger size={24} />
              </button>
            )}
          </ListItemTrailing>
        ) : null}
      </ListItem>
    </div>
  );
}
