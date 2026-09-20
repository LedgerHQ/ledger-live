import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { CardAssetsManageRow } from "./CardAssetsManageRow.web";
import type { CardAssetsManageContentProps } from "./types";

type CardAssetsManageDialogProps = CardAssetsManageContentProps &
  Readonly<{
    isOpen: boolean;
    onClose: () => void;
  }>;

export function CardAssetsManageDialog({
  isOpen,
  rows,
  onClose,
  onAddAsset,
  onReorder,
  reorderingAssetId,
}: CardAssetsManageDialogProps) {
  const { t } = useTranslation();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const title = t("payTab.card.assets.manageDialog.title");

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()} height="fixed">
      <DialogContent className="max-w-480" aria-describedby={undefined}>
        <DialogHeader onClose={onClose} className="!mb-0" />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden pb-24">
          <div className="flex shrink-0 flex-col gap-8 text-start">
            <h2 className="heading-3-semi-bold text-base">{title}</h2>
            <p className="body-2 text-muted">{t("payTab.card.assets.manageDialog.description")}</p>
          </div>
          <div className="min-h-0 overflow-x-hidden overflow-y-auto rounded-md bg-surface px-12">
            {rows.map(row => (
              <CardAssetsManageRow
                key={row.id}
                row={row}
                isReordering={reorderingAssetId === row.id}
                isReorderDisabled={reorderingAssetId !== null}
                onDragStart={() => setDraggedId(row.id)}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={event => draggedId && event.preventDefault()}
                onDrop={() => {
                  if (draggedId) void onReorder(draggedId, row.id);
                  setDraggedId(null);
                }}
              />
            ))}
          </div>
        </DialogBody>
        {onAddAsset ? (
          <DialogFooter
            className="flex shrink-0 flex-col gap-12 text-center"
            data-testid="card-assets-manage-footer"
          >
            <p className="body-4 text-muted">
              {t("payTab.card.assets.manageDialog.addAssetCaption")}
            </p>
            <Button appearance="base" size="lg" isFull onClick={onAddAsset}>
              {t("payTab.card.assets.manageDialog.addAsset")}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
