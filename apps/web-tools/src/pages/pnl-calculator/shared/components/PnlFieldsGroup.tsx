import { PnlAmountField } from "./PnlAmountField";
import { PnlSwitchField } from "./PnlSwitchField";
import type { PnlField } from "./types";

type PnlFieldsGroupProps = Readonly<{
  fields: PnlField[];
}>;

export function PnlFieldsGroup({ fields }: PnlFieldsGroupProps) {
  return (
    <>
      {fields.map(field => {
        switch (field.kind) {
          case "amount":
            return (
              <PnlAmountField
                key={field.id}
                id={field.id}
                label={field.label}
                value={field.value}
                currencySymbol={field.currencySymbol}
                onChange={field.onChange}
              />
            );
          case "switch":
            return (
              <PnlSwitchField
                key={field.id}
                id={field.id}
                label={field.label}
                selected={field.selected}
                onChange={field.onChange}
              />
            );
        }
      })}
    </>
  );
}
