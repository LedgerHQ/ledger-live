import { useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { AccountAggregationToolProps, AggregationRun } from "../types";

const time = (at: number) => new Date(at).toLocaleTimeString();
const short = (uuid: string) => uuid.slice(0, 8);

function AccountAggregation({
  accountCount,
  running,
  runs,
  onFetchTotalBalance,
  onClear,
}: AccountAggregationToolProps) {
  const [force, setForce] = useState(true);
  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex items-center gap-16 flex-shrink-0">
        <Button size="sm" disabled={running} onClick={() => onFetchTotalBalance({ force })}>
          Fetch total balance
        </Button>
        <label className="body-3 text-muted flex items-center gap-6">
          <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} />
          <span>ignore fresh balances</span>
        </label>
        <span className="body-3 text-muted flex-1">
          {accountCount} {accountCount === 1 ? "account" : "accounts"}, read in one tick
        </span>
        <Button size="sm" appearance="gray" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {runs.length === 0 ? (
          <div className="px-16 py-10 body-3 text-muted">
            Reads the balance of every account at once: the router splits them between the sources,
            and the answers come back here as one payload.
          </div>
        ) : null}
        {runs.map(run => (
          <Run key={run.id} run={run} />
        ))}
      </div>
    </div>
  );
}

function Run({ run }: Readonly<{ run: AggregationRun }>) {
  const done = run.durationMs !== undefined;
  const failed = run.perAccount.filter(account => account.error);
  return (
    <div className="px-16 py-10 border-b border-base flex flex-col gap-8 body-3 font-mono">
      <div className="text-muted">
        #{run.id} · {time(run.startedAt)} · {run.accounts} accounts{" "}
        {done ? `· ${run.durationMs} ms` : "· running…"}
        {run.force ? "" : " · fresh balances kept"}
      </div>
      {done ? (
        <div className="flex items-baseline gap-12 flex-wrap">
          <span className="heading-3-semi-bold text-base" data-testid="fiat-total">
            {run.fiatTotal}
          </span>
          {run.unvalued > 0 ? (
            <span className="text-muted">{run.unvalued} assets without a rate left out</span>
          ) : null}
          {failed.length > 0 ? (
            <span className="text-error">
              {failed.length} {failed.length === 1 ? "account" : "accounts"} failed, not counted
            </span>
          ) : null}
        </div>
      ) : null}
      {failed.map(account => (
        <div key={account.accountUUID} className="flex gap-12 text-error">
          <span className="flex-shrink-0">{short(account.accountUUID)}</span>
          <span className="flex-shrink-0">{account.label}</span>
          <span className="break-all">{account.error}</span>
        </div>
      ))}
      {run.sources.map(source => (
        <div key={source.sourceId} className="text-base">
          <span className="body-3-semi-bold">{source.sourceId}</span>: {source.ok} ok
          {source.failed > 0 ? (
            <span className="text-error">, {source.failed} failed</span>
          ) : null}{" "}
          <span className="text-muted">
            ·{" "}
            {source.calls
              .map(
                call =>
                  `${call.batch ? "readBatch" : "read"}(${call.accounts}) ${call.elapsedMs} ms`,
              )
              .join(", ") || "no call (fresh)"}
          </span>
        </div>
      ))}
      {run.unanswered > 0 ? (
        <div className="text-error">{run.unanswered} accounts answered by no source</div>
      ) : null}
      {run.totals.length > 0 ? (
        <table className="w-full text-left">
          <thead className="text-muted">
            <tr>
              <th className="py-4 font-normal">Asset</th>
              <th className="py-4 font-normal">Accounts</th>
              <th className="py-4 font-normal text-right">Balance</th>
              <th className="py-4 font-normal text-right">Countervalue</th>
            </tr>
          </thead>
          <tbody className="text-base">
            {run.totals.map(total => (
              <tr key={total.assetId}>
                <td className="py-2 break-all">{total.assetId}</td>
                <td className="py-2">{total.accounts}</td>
                <td className="py-2 text-right">{total.balance}</td>
                <td className="py-2 text-right body-3-semi-bold">{total.fiat ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <details>
        <summary className="cursor-pointer text-muted">Per account</summary>
        {run.perAccount.map(account => (
          <div key={account.accountUUID} className="flex gap-12">
            <span className="flex-shrink-0">{short(account.accountUUID)}</span>
            <span className="text-muted flex-1 min-w-0 break-all">{account.label}</span>
            <span>{account.sourceId ?? "—"}</span>
            {account.error ? (
              <span className="text-error break-all">{account.error}</span>
            ) : (
              <span>{account.assets} assets</span>
            )}
          </div>
        ))}
      </details>
      <details>
        <summary className="cursor-pointer text-muted">Payload</summary>
        <pre className="whitespace-pre-wrap break-all text-muted">{run.payload}</pre>
      </details>
    </div>
  );
}

export default AccountAggregation;
