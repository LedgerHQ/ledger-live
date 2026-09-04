import React from "react";
import { Button, Divider, Tag } from "@ledgerhq/lumen-ui-react";
import type { AccountOperationsRow, AccountOperationsToolProps, ListedOperation } from "../types";
import {
  blockLine,
  countLine,
  formatAmount,
  formatDate,
  statusLine,
} from "./AccountOperations.internals";

function OperationRow({ operation }: Readonly<{ operation: ListedOperation }>) {
  return (
    <li className="flex items-baseline justify-between gap-16 py-2">
      <span className="flex items-baseline gap-8 min-w-0">
        <span className="body-4 text-muted whitespace-nowrap">{formatDate(operation.date)}</span>
        <span className="body-4 whitespace-nowrap">{operation.type}</span>
        {/* The two things the flat model made visible: a nested row is a token transfer or an
            internal call lifted out of its parent, and it can live on a different account. */}
        {operation.nested ? <Tag size="sm" appearance="gray" label="nested" /> : null}
        {operation.onTokenAccount ? <Tag size="sm" label="token account" /> : null}
      </span>
      <span className="body-4 tabular-nums whitespace-nowrap">
        {formatAmount(operation.value, operation.unit)}
        <span className="text-muted"> · {blockLine(operation)}</span>
      </span>
    </li>
  );
}

function Row({
  row,
  onRefresh,
  onLoadMore,
}: Readonly<{ row: AccountOperationsRow; onRefresh: () => void; onLoadMore: () => void }>) {
  return (
    <div className="flex flex-col gap-8 py-16">
      <div className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-8 flex-wrap">
            <span className="body-2-semi-bold truncate">{row.name}</span>
            <Tag size="sm" label={row.currencyId} />
            {row.granular ? (
              <Tag size="sm" appearance="success" label="granular" />
            ) : (
              <Tag size="sm" appearance="gray" label="full sync only" />
            )}
          </div>
          <code className="body-4 text-muted truncate" title={row.address}>
            {row.address}
          </code>
        </div>

        <div className="flex items-center gap-12 shrink-0">
          <span className="body-1-semi-bold tabular-nums whitespace-nowrap">{countLine(row)}</span>
          <Button size="sm" onClick={onRefresh} disabled={row.status.pending}>
            {row.status.pending ? "Reading…" : "Refresh"}
          </Button>
          {/* Disabled rather than hidden: on a source that cannot resume from a cursor there is no
              next page to ask for, and seeing the button greyed out is the point. */}
          <Button
            size="sm"
            appearance="transparent"
            onClick={onLoadMore}
            disabled={!row.hasMore || row.status.pending}
          >
            Load more
          </Button>
        </div>
      </div>

      <span className={`body-4 ${row.status.error ? "text-error" : "text-muted"}`}>
        {statusLine(row)}
      </span>

      {row.operations.length > 0 ? (
        <ul className="list-none p-0 m-0 flex flex-col border-l border-base pl-12">
          {row.operations.map(operation => (
            <OperationRow key={operation.id} operation={operation} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AccountOperations(props: Readonly<AccountOperationsToolProps>) {
  const { accounts, onRefresh, onLoadMore, ready } = props;

  return (
    <div className="flex flex-col gap-16 overflow-y-auto p-16">
      <p className="body-3 text-muted m-0">
        Reads go through <code>@features/platform-account-data</code>, one page at a time.{" "}
        <strong>Load more</strong> only does something on a source that can resume from a cursor —
        on a family served by <code>AccountBridge.sync()</code> the first read already returned the
        entire history, so there is no page two.
      </p>

      <p className="body-3 text-muted m-0">
        Watch the count: <em>total unknown</em> is the honest answer while the window is partial. A
        paginated read cannot know how many operations an account has, which is what makes
        <code> operationsCount</code> a number that is sometimes absent.
      </p>

      {ready ? null : (
        <p className="body-3 text-warning m-0">
          No history source is registered in this host, so a read can only report that nothing can
          serve the account.
        </p>
      )}

      <span className="body-4 text-muted">
        {accounts.length} account{accounts.length === 1 ? "" : "s"}
      </span>

      <Divider />

      {accounts.length === 0 ? (
        <p className="body-3 text-muted m-0">No accounts in this profile.</p>
      ) : (
        <div className="flex flex-col">
          {accounts.map((row, index) => (
            <React.Fragment key={row.accountId}>
              {index > 0 ? <Divider /> : null}
              <Row
                row={row}
                onRefresh={() => onRefresh(row.accountId)}
                onLoadMore={() => onLoadMore(row.accountId)}
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default AccountOperations;
