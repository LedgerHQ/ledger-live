import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import type { PayCardCurrencyMappingRow } from "../../types";
import { Section } from "../Section/Section";

export interface CurrencyMappingScreenProps {
  readonly rows: readonly PayCardCurrencyMappingRow[];
  readonly onBack: () => void;
}

export function CurrencyMappingScreen({ rows, onBack }: CurrencyMappingScreenProps) {
  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="p-16">
        <Button appearance="gray" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>

      <Section title="Currency Mapping">
        <p className="body-3 text-muted">
          {`${rows.length} pairs. An asset answered with a pair absent here resolves to nothing.`}
        </p>

        {/*
          Scrolls sideways rather than wrapping: a Ledger token id is long, and truncating it would
          hide the half that tells two tokens apart.
        */}
        <div className="overflow-x-auto">
          <table className="body-3 text-left border-separate border-spacing-x-12">
            <thead>
              <tr className="text-muted">
                <th className="font-normal whitespace-nowrap">currency.network</th>
                <th className="font-normal whitespace-nowrap">ledgerId</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, ledgerId }) => (
                <tr key={key} className="text-base">
                  <td className="whitespace-nowrap">{key}</td>
                  <td className="whitespace-nowrap">{ledgerId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Divider />
      </Section>
    </div>
  );
}
