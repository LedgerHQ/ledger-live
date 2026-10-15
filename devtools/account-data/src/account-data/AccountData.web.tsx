import React from "react";
import { Button, Divider, Tag } from "@ledgerhq/lumen-ui-react";
import type { AccountDataRow, AccountDataToolProps, AmountUnit } from "../types";
import { formatAmount, formatTrend, formatValue, statusLine } from "./AccountData.internals";

type RowProps = Readonly<{
  row: AccountDataRow;
  fiat?: AmountUnit;
  onReadBalance: () => void;
  onReadOperations: () => void;
  onLoadMoreOperations: () => void;
}>;

function Status({ line, error }: Readonly<{ line: string; error: boolean }>) {
  return <span className={`body-4 ${error ? "text-error" : "text-muted"}`}>{line}</span>;
}

function Assets({ row, fiat }: Readonly<{ row: AccountDataRow; fiat?: AmountUnit }>) {
  if (row.assets.length === 0) return null;
  return (
    <table className="w-full body-4 tabular-nums">
      <thead className="text-muted">
        <tr>
          <th className="text-left font-normal">Asset</th>
          <th className="text-right font-normal">Balance</th>
          <th className="text-right font-normal">Value</th>
          <th className="text-right font-normal">Trend</th>
        </tr>
      </thead>
      <tbody>
        {row.assets.map(asset => (
          <tr key={asset.assetId}>
            <td className="truncate" title={asset.assetId}>
              {asset.assetId}
            </td>
            <td className="text-right whitespace-nowrap">
              {formatAmount(asset.balance, asset.unit)}
              {asset.spendable === asset.balance ? null : (
                <span className="text-muted">{` (${formatAmount(asset.spendable, asset.unit)} spendable)`}</span>
              )}
            </td>
            <td className="text-right whitespace-nowrap">{formatValue(asset.value, fiat)}</td>
            <td className="text-right whitespace-nowrap">{formatTrend(asset.trend)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Operations({
  row,
  onLoadMore,
}: Readonly<{ row: AccountDataRow; onLoadMore: () => void }>) {
  if (row.operations.length === 0 && !row.hasMoreOperations) return null;
  return (
    <div className="flex flex-col gap-4">
      <ul className="list-none p-0 m-0 flex flex-col border-l border-base pl-12">
        {row.operations.map(operation => (
          <li key={operation.id} className="flex justify-between gap-16 body-4 tabular-nums">
            <span className="text-muted whitespace-nowrap">{operation.date.slice(0, 16)}</span>
            <span>{operation.type}</span>
            <span className="truncate" title={operation.hash}>
              {formatAmount(operation.value, operation.unit)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-12">
        <span className="body-4 text-muted">
          {row.operations.length}
          {row.operationsTotal === undefined ? "" : ` of ${row.operationsTotal}`} operations
        </span>
        {row.hasMoreOperations ? (
          <Button size="sm" onClick={onLoadMore} disabled={row.operationsStatus.pending}>
            Load more
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Row({ row, fiat, onReadBalance, onReadOperations, onLoadMoreOperations }: RowProps) {
  return (
    <div className="flex flex-col gap-8 py-16">
      <div className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-8 flex-wrap">
            <span className="body-2-semi-bold truncate">{row.name}</span>
            <Tag size="sm" label={row.currencyId} />
          </div>
          <code className="body-4 text-muted truncate" title={row.address}>
            {row.address}
          </code>
        </div>
        <div className="flex items-center gap-8 shrink-0">
          <Button size="sm" onClick={onReadBalance} disabled={row.balanceStatus.pending}>
            Read balance
          </Button>
          <Button size="sm" onClick={onReadOperations} disabled={row.operationsStatus.pending}>
            Read operations
          </Button>
        </div>
      </div>

      <Status
        line={`balance: ${statusLine(row.balanceStatus)}`}
        error={!!row.balanceStatus.error}
      />
      <Assets row={row} fiat={fiat} />

      <Status
        line={`operations: ${statusLine(row.operationsStatus)}`}
        error={!!row.operationsStatus.error}
      />
      <Operations row={row} onLoadMore={onLoadMoreOperations} />
    </div>
  );
}

function AccountData(props: Readonly<AccountDataToolProps>) {
  const { accounts, fiat, onReadBalance, onReadOperations, onLoadMoreOperations, onReadAll } =
    props;
  return (
    <div className="flex flex-col gap-16 overflow-y-auto p-16">
      <p className="body-3 text-muted m-0">
        Reads go through <code>@domain/api-account-data</code>: each kind is asked for on its own,
        and the first ranked source that serves the account answers. The value and trend columns
        join the balance entity with the countervalues, as the Account page would.
      </p>

      <div className="flex items-center gap-12 flex-wrap">
        <Button size="sm" onClick={onReadAll} disabled={accounts.length === 0}>
          Read all balances
        </Button>
        <span className="body-4 text-muted">
          respects freshness, like a portfolio mount · {accounts.length} account
          {accounts.length === 1 ? "" : "s"}
        </span>
      </div>

      <Divider />

      {accounts.length === 0 ? (
        <p className="body-3 text-muted m-0">No accounts in this profile.</p>
      ) : (
        <div className="flex flex-col">
          {accounts.map((row, index) => (
            <React.Fragment key={row.accountUUID}>
              {index > 0 ? <Divider /> : null}
              <Row
                row={row}
                fiat={fiat}
                onReadBalance={() => onReadBalance(row.accountUUID)}
                onReadOperations={() => onReadOperations(row.accountUUID)}
                onLoadMoreOperations={() => onLoadMoreOperations(row.accountUUID)}
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default AccountData;
