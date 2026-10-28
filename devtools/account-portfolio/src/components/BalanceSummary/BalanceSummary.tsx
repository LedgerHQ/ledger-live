import { Tag } from "@ledgerhq/lumen-ui-react";
import { formatCurrencyValue } from "../../utils/format";
import type { BalanceTotals } from "../../utils/mergeBalances";

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** What a balance adds up to, before the lines that make it up. */
export function BalanceSummary({
  totals,
  currency,
}: Readonly<{ totals: BalanceTotals; currency: string }>) {
  if (totals.assets === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-8">
      <Tag
        appearance="accent"
        size="md"
        label={`Total ${formatCurrencyValue(totals.fiat, currency)}`}
      />
      <Tag appearance="gray" size="md" label={plural(totals.assets, "asset")} />
      <Tag appearance="gray" size="md" label={plural(totals.accounts, "account")} />
      {totals.unvalued > 0 ? (
        <Tag appearance="warning" size="md" label={`${totals.unvalued} without a value`} />
      ) : null}
    </div>
  );
}
