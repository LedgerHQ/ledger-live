import type { LineChartColor, LineChartPointMarker } from "LLD/components/LineChart";
import type { TransactionChartGroup } from "@ledgerhq/asset-detail";

type TranslateFn = (key: string, options?: { count: number }) => string;

/**
 * Maps an aggregated transaction group to a chart point marker.
 *
 * - A single received transaction is green (`success`), a single sent one is red (`error`),
 *   and any point holding several transactions is neutral (`muted`).
 * - The tooltip lists a Received and/or Sent row (only when that direction has activity) and,
 *   for points with more than one transaction, a "{count} transactions" title.
 */
export function buildTransactionPointMarker(
  group: TransactionChartGroup,
  t: TranslateFn,
  formatFiat: (value: number) => string,
): LineChartPointMarker {
  const count = group.receivedCount + group.sentCount;

  const rows: { label: string; value: string }[] = [];
  if (group.receivedCount > 0) {
    rows.push({ label: t("assetDetails.chart.received"), value: formatFiat(group.receivedFiat) });
  }
  if (group.sentCount > 0) {
    rows.push({ label: t("assetDetails.chart.sent"), value: formatFiat(group.sentFiat) });
  }

  let color: LineChartColor = "muted";
  if (count === 1) {
    color = group.sentCount === 1 ? "error" : "success";
  }

  return {
    index: group.index,
    value: group.value,
    color,
    hidePoint: false,
    hideLabel: true,
    tooltip: {
      title: count > 1 ? t("assetDetails.chart.transactionsCount", { count }) : undefined,
      rows,
    },
  } satisfies LineChartPointMarker;
}
