import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { useListReorder } from "@shared/ui-list-reorder";
import { CardAssetsManageRow } from "./CardAssetsManageRow.web";
import type { CardAssetRow } from "./types";

type CardAssetsManageDialogProps = Readonly<{
  isOpen: boolean;
  rows: readonly CardAssetRow[];
  onClose: () => void;
  onAddAsset?: () => void;
  onMoveAsset: (id: string, toIndex: number) => Promise<void>;
  reorderingAssetId: string | null;
}>;

export function CardAssetsManageDialog({
  isOpen,
  rows,
  onClose,
  onAddAsset,
  onMoveAsset,
  reorderingAssetId,
}: CardAssetsManageDialogProps) {
  const { t } = useTranslation();
  const reorder = useListReorder({
    onMove: (id, toIndex) => void onMoveAsset(id, toIndex),
    disabled: reorderingAssetId !== null,
  });

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
              <CardAssetsManageRow
                key={row.id}
                row={row}
                isReordering={reorderingAssetId === row.id}
                isReorderDisabled={reorderingAssetId !== null}
                rowProps={reorder.getRowProps(row.id)}
                handleProps={reorder.getHandleProps(row.id)}
                reorderLabel={t("payTab.card.assets.manageDialog.reorder", { asset: row.name })}
              />
            ))}
          </div>
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {reorder.announcement}
          </div>
        </DialogBody>
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
      </DialogContent>
    </Dialog>
  );
}
