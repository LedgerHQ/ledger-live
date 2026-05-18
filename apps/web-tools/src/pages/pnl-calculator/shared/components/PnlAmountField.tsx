import { useId } from "react";
import { AmountInput } from "@ledgerhq/lumen-ui-react";
import { PnlLabeledField } from "./PnlLabeledField";

type PnlAmountFieldProps = Readonly<{
  /** When omitted, a generated id is used. Pass a stable id when labels can collide. */
  id?: string;
  label: string;
  value: string;
  currencySymbol: string;
  onChange: (next: string) => void;
}>;

export function PnlAmountField({
  id,
  label,
  value,
  currencySymbol,
  onChange,
}: PnlAmountFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <PnlLabeledField id={inputId} label={label}>
      <AmountInput
        id={inputId}
        value={value}
        onChange={e => onChange(e.target.value)}
        currencyText={currencySymbol}
        currencyPosition="left"
        thousandsSeparator={false}
        className="w-full min-w-0 tabular-nums"
      />
    </PnlLabeledField>
  );
}
