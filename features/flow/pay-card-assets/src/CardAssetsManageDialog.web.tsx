import React, { useCallback } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      const toIndex = rows.findIndex(row => row.id === over.id);
      if (toIndex >= 0) void onMoveAsset(String(active.id), toIndex);
    },
    [rows, onMoveAsset],
  );

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rows.map(row => row.id)}
                strategy={verticalListSortingStrategy}
              >
                {rows.map(row => (
                  <CardAssetsManageRow
                    key={row.id}
                    row={row}
                    showHandle={rows.length > 1}
                    isReordering={reorderingAssetId === row.id}
                    reorderLabel={t("payTab.card.assets.manageDialog.reorder", {
                      asset: row.name,
                    })}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
