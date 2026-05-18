import { Tag, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import type { FormattedReconciliation } from "../usePortfolioViewModel";

type ReconciliationBadgeProps = Readonly<{
  reconciliation: FormattedReconciliation;
}>;

/**
 * Surfaces the fact that the cost-basis reducer disagreed with the on-chain
 * balance and a synthetic operation was folded in. Without this badge, rows
 * with a recovered PnL are indistinguishable from clean ones — which makes
 * the silent reconciliation mutation surprising for anyone who looks at the
 * raw operations stream and tries to reconcile the numbers by hand.
 */
export function ReconciliationBadge({ reconciliation }: ReconciliationBadgeProps) {
  const { direction, formattedDelta } = reconciliation;
  const tooltipText =
    direction === "inflow"
      ? `On-chain balance is greater than what operations imply. PnL was adjusted by a synthetic inflow of ${formattedDelta}, valued at the latest market rate (typical of rebase tokens or missing IN operations).`
      : `On-chain balance is lower than what operations imply. PnL was adjusted by a synthetic outflow of ${formattedDelta}, valued at the last known operation date (typical of ERC-20 transferFrom flows where the OUT wasn't captured).`;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Tag size="sm" appearance="warning" label="adjusted" />
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
