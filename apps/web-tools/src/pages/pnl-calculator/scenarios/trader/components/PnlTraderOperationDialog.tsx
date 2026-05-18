import { useEffect, useId, useState } from "react";
import {
  AmountInput,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { PnlLabeledField } from "../../../shared/components/PnlLabeledField";
import { TypedSegmentedControl } from "../../../shared/components/TypedSegmentedControl";
import { TRADER_OP_KINDS } from "../model/assets";
import type { TraderOpInput, TraderOpKind } from "../model/types";

type PnlTraderOperationDialogProps = Readonly<{
  open: boolean;
  /** Pre-fill values for editing, or sensible defaults for a new op. */
  initial: TraderOpInput;
  title: string;
  saveLabel: string;
  assetTicker: string;
  fiatCode: string;
  fiatSymbol: string;
  onSave: (values: TraderOpInput) => void;
  onCancel: () => void;
}>;

export function PnlTraderOperationDialog({
  open,
  initial,
  title,
  saveLabel,
  assetTicker,
  fiatCode,
  fiatSymbol,
  onSave,
  onCancel,
}: PnlTraderOperationDialogProps) {
  const baseId = useId();
  const kindLabelId = `${baseId}-kind`;

  const [kind, setKind] = useState<TraderOpKind>(initial.kind);
  const [amount, setAmount] = useState<string>(initial.amount);
  const [priceUsd, setPriceUsd] = useState<string>(initial.priceUsd);
  const [date, setDate] = useState<string>(initial.date);

  // Sync local state when the dialog reopens with new `initial` values (e.g. editing a different row).
  useEffect(() => {
    if (open) {
      setKind(initial.kind);
      setAmount(initial.amount);
      setPriceUsd(initial.priceUsd);
      setDate(initial.date);
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={next => !next && onCancel()}>
      <DialogContent className="max-w-480">
        <DialogHeader title={title} onClose={onCancel} />
        <DialogBody className="flex flex-col gap-16">
          <div className="flex flex-col gap-8">
            <span id={kindLabelId} className="body-3 text-muted">
              Type
            </span>
            <TypedSegmentedControl
              values={TRADER_OP_KINDS}
              selected={kind}
              onSelect={setKind}
              renderLabel={k => k}
              ariaLabelledBy={kindLabelId}
            />
          </div>

          <PnlLabeledField id={`${baseId}-amount`} label={`Amount (${assetTicker})`}>
            <AmountInput
              id={`${baseId}-amount`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              currencyText={assetTicker}
              currencyPosition="right"
              thousandsSeparator={false}
              className="w-full min-w-0 tabular-nums"
            />
          </PnlLabeledField>

          <PnlLabeledField id={`${baseId}-price`} label={`Price at date (${fiatCode})`}>
            <AmountInput
              id={`${baseId}-price`}
              value={priceUsd}
              onChange={e => setPriceUsd(e.target.value)}
              currencyText={fiatSymbol}
              currencyPosition="left"
              thousandsSeparator={false}
              className="w-full min-w-0 tabular-nums"
            />
          </PnlLabeledField>

          <PnlLabeledField id={`${baseId}-date`} label="Date">
            <TextInput
              id={`${baseId}-date`}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              hideClearButton
              className="w-full"
            />
          </PnlLabeledField>
        </DialogBody>
        <DialogFooter className="flex justify-end gap-8">
          <Button appearance="gray" onClick={onCancel}>
            Cancel
          </Button>
          <Button appearance="base" onClick={() => onSave({ kind, amount, priceUsd, date })}>
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
