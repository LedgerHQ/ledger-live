import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTrailing,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { MenuBurger } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import type { CardAssetRow } from "./types";

type CardAssetsManageDialogProps = Readonly<{
  isOpen: boolean;
  rows: readonly CardAssetRow[];
  onClose: () => void;
  onAddAsset: () => void;
  onReorder: (draggedId: string, targetId: string) => Promise<void>;
  isReordering: boolean;
}>;

export function CardAssetsManageDialog({
  isOpen,
  rows,
  onClose,
  onAddAsset,
  onReorder,
  isReordering,
}: CardAssetsManageDialogProps) {
  const { t } = useTranslation();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()} height="fixed">
      <DialogContent
        className="max-w-480"
        data-testid="card-assets-manage-dialog"
        aria-describedby={undefined}
      >
        <DialogHeader onClose={onClose} className="!mb-0" />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden pb-24">
          <div className="flex shrink-0 flex-col gap-8 text-start">
            <h2 className="heading-3-semi-bold text-base">
              {t("payTab.card.assets.manageDialog.title")}
            </h2>
            <p className="body-2 text-muted">{t("payTab.card.assets.manageDialog.description")}</p>
          </div>
          <div className="min-h-0 overflow-x-hidden overflow-y-auto rounded-md bg-surface px-12">
            {rows.map(row => (
              <div
                key={row.id}
                data-testid={`card-asset-order-${row.id}`}
                onDragOver={event => draggedId && event.preventDefault()}
                onDrop={() => {
                  if (draggedId) void onReorder(draggedId, row.id);
                  setDraggedId(null);
                }}
              >
                <ListItem className="bg-surface">
                  <ListItemLeading>
                    <ListItemContent>
                      <ListItemTitle className="body-2-semi-bold">{row.name}</ListItemTitle>
                    </ListItemContent>
                  </ListItemLeading>
                  <ListItemTrailing>
                    <button
                      type="button"
                      draggable={!isReordering}
                      disabled={isReordering}
                      aria-label={`Drag ${row.name}`}
                      className="cursor-grab text-muted active:cursor-grabbing"
                      onDragStart={() => setDraggedId(row.id)}
                      onDragEnd={() => setDraggedId(null)}
                    >
                      <MenuBurger size={24} />
                    </button>
                  </ListItemTrailing>
                </ListItem>
              </div>
            ))}
          </div>
          <div className="mt-auto flex shrink-0 flex-col gap-12 pt-16 text-center">
            <p className="body-4 text-muted">
              {t("payTab.card.assets.manageDialog.addAssetCaption")}
            </p>
            <Button appearance="base" size="lg" isFull onClick={onAddAsset}>
              {t("payTab.card.assets.manageDialog.addAsset")}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
