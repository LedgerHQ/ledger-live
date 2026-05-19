import { useState } from "react";
import {
  Button,
  IconButton,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { Plus, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import type { TagProps } from "@ledgerhq/lumen-ui-react";
import { PnlTraderOperationDialog } from "./PnlTraderOperationDialog";
import type { TraderOpInput, TraderOpKind, TraderOpRow } from "../model/types";

type PnlTraderOperationsEditorProps = Readonly<{
  rows: TraderOpRow[];
  assetTicker: string;
  fiatCode: string;
  fiatSymbol: string;
  defaultOpInput: TraderOpInput;
  onAdd: (values: TraderOpInput) => void;
  onSet: (id: string, values: TraderOpInput) => void;
  onRemove: (id: string) => void;
}>;

type DialogState =
  | { mode: "add"; initial: TraderOpInput }
  | { mode: "edit"; rowId: string; initial: TraderOpInput }
  | null;

const KIND_TAG_APPEARANCE: Record<TraderOpKind, TagProps["appearance"]> = {
  IN: "success",
  OUT: "warning",
  FEES: "gray",
};

export function PnlTraderOperationsEditor({
  rows,
  assetTicker,
  fiatCode,
  fiatSymbol,
  defaultOpInput,
  onAdd,
  onSet,
  onRemove,
}: PnlTraderOperationsEditorProps) {
  const [dialog, setDialog] = useState<DialogState>(null);

  const openAdd = () => setDialog({ mode: "add", initial: defaultOpInput });
  const openEdit = (row: TraderOpRow) => {
    const { id: _id, ...values } = row;
    setDialog({ mode: "edit", rowId: row.id, initial: values });
  };
  const closeDialog = () => setDialog(null);

  const handleSave = (values: TraderOpInput) => {
    if (!dialog) return;
    if (dialog.mode === "add") onAdd(values);
    else onSet(dialog.rowId, values);
    setDialog(null);
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center justify-between">
        <span className="body-3 text-muted">Operations</span>
        <span className="body-3 text-muted">
          {rows.length} {rows.length === 1 ? "row" : "rows"}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col">
          {rows.map(row => (
            <li key={row.id}>
              <OperationListItem
                row={row}
                assetTicker={assetTicker}
                fiatSymbol={fiatSymbol}
                onEdit={() => openEdit(row)}
                onRemove={() => onRemove(row.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <Button appearance="gray" size="sm" icon={Plus} onClick={openAdd}>
        Add operation
      </Button>

      <PnlTraderOperationDialog
        open={dialog !== null}
        initial={dialog?.initial ?? defaultOpInput}
        title={dialog?.mode === "edit" ? "Edit operation" : "Add operation"}
        saveLabel={dialog?.mode === "edit" ? "Save" : "Add"}
        assetTicker={assetTicker}
        fiatCode={fiatCode}
        fiatSymbol={fiatSymbol}
        onSave={handleSave}
        onCancel={closeDialog}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-muted rounded-md flex items-center justify-center border border-dashed px-16 py-24 text-center">
      <span className="body-3 text-muted">No operations yet — add one to see PnL.</span>
    </div>
  );
}

type OperationListItemProps = Readonly<{
  row: TraderOpRow;
  assetTicker: string;
  fiatSymbol: string;
  onEdit: () => void;
  onRemove: () => void;
}>;

function OperationListItem({
  row,
  assetTicker,
  fiatSymbol,
  onEdit,
  onRemove,
}: OperationListItemProps) {
  // Stop list-item click from also opening the dialog when the user just wants
  // to delete a row.
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  const sign = row.kind === "IN" ? "+" : "−";
  const formattedAmount = `${sign}${prettyDecimal(row.amount)} ${assetTicker}`;
  const formattedPrice = `${fiatSymbol}${prettyDecimal(row.priceUsd)}`;
  const formattedDate = formatDate(row.date);

  return (
    <ListItem density="compact" onClick={onEdit}>
      <ListItemLeading>
        <Tag
          size="sm"
          appearance={KIND_TAG_APPEARANCE[row.kind]}
          label={row.kind}
          className="w-44 shrink-0"
        />
        <ListItemContent>
          <ListItemTitle className="tabular-nums">{formattedAmount}</ListItemTitle>
          <ListItemDescription className="tabular-nums">
            {formattedDate} · @ {formattedPrice}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <IconButton
          appearance="no-background"
          size="sm"
          icon={Trash}
          onClick={handleRemoveClick}
          aria-label={`Remove ${row.kind} operation`}
        />
      </ListItemTrailing>
    </ListItem>
  );
}

/** Trims trailing zeros and a dangling decimal point (O(n), no regex backtracking). */
function prettyDecimal(s: string): string {
  if (!s) return "—";
  if (!s.includes(".")) return s;
  let end = s.length;
  while (end > 0 && s[end - 1] === "0") end -= 1;
  if (end > 0 && s[end - 1] === ".") end -= 1;
  return s.slice(0, end) || "0";
}

/** Formats `YYYY-MM-DD` as `MMM D, YYYY` (locale-neutral fallback). */
function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
