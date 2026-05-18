import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableHeaderRow,
  TableRoot,
  TableRow,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { FormattedAssetRow } from "../usePortfolioViewModel";
import { ReconciliationBadge } from "./ReconciliationBadge";

type PnlAssetBreakdownTableProps = Readonly<{
  rows: FormattedAssetRow[];
}>;

export function PnlAssetBreakdownTable({ rows }: PnlAssetBreakdownTableProps) {
  return (
    <Card type="info" className="w-full min-w-0">
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>Per-asset breakdown</CardContentTitle>
            <CardContentDescription>
              {rows.length} row{rows.length === 1 ? "" : "s"} · sorted by |Total PnL| desc
            </CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>

      <div className="px-24 pb-24">
        {rows.length === 0 ? (
          <CardContentDescription>
            No assets produced a PnL — check the skipped accounts list below.
          </CardContentDescription>
        ) : (
          <TableRoot>
            <Table>
              <TableHeader>
                <TableHeaderRow>
                  <TableHeaderCell>Asset</TableHeaderCell>
                  <TableHeaderCell align="end" hideBelow="md">
                    Holdings
                  </TableHeaderCell>
                  <TableHeaderCell align="end">Cost basis</TableHeaderCell>
                  <TableHeaderCell align="end" hideBelow="md">
                    Realised
                  </TableHeaderCell>
                  <TableHeaderCell align="end" hideBelow="md">
                    Unrealised
                  </TableHeaderCell>
                  <TableHeaderCell align="end">Total PnL</TableHeaderCell>
                  <TableHeaderCell align="end" hideBelow="lg">
                    % vs cost
                  </TableHeaderCell>
                </TableHeaderRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-12">
                        <CryptoIcon ledgerId={row.currencyId} ticker={row.ticker} size={24} />
                        <div className="flex min-w-0 flex-col">
                          <div className="flex min-w-0 items-center gap-8">
                            <span className="body-2 truncate" title={row.label}>
                              {row.label}
                            </span>
                            {row.reconciliation.applied ? (
                              <ReconciliationBadge reconciliation={row.reconciliation} />
                            ) : null}
                          </div>
                          <span className="body-3 text-muted">
                            {row.ticker}
                            {row.isTokenAccount ? " · token" : ""}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell align="end" hideBelow="md" className="tabular-nums">
                      {row.formattedHoldings}
                    </TableCell>
                    <TableCell align="end" className="tabular-nums">
                      {row.formattedCostBasis}
                    </TableCell>
                    <TableCell align="end" hideBelow="md" className="tabular-nums">
                      {row.formattedRealised}
                    </TableCell>
                    <TableCell align="end" hideBelow="md" className="tabular-nums">
                      {row.formattedUnrealised}
                    </TableCell>
                    <TableCell align="end" className="tabular-nums">
                      <span style={row.totalTone}>{row.formattedTotal}</span>
                    </TableCell>
                    <TableCell align="end" hideBelow="lg" className="tabular-nums">
                      <span style={row.totalTone}>{row.formattedPctVsCost}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableRoot>
        )}
      </div>
    </Card>
  );
}
