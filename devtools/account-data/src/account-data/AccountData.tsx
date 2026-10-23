import { useEffect, useState } from "react";
import type { AccountDataToolEvent, AccountDataToolProps, AccountDataToolStatus } from "../types";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const time = (at: number) => new Date(at).toLocaleTimeString();
const short = (uuid: string) => uuid.slice(0, 8);
const elapsed = (ms?: number) => (ms === undefined ? "" : ` in ${ms} ms`);

function stateOf(status: AccountDataToolStatus, now: number, maxAge: number): string {
  if (status.reading) return status.reading === "head" ? "reading" : "reading next page";
  if (status.error) return "failed";
  if (status.readAt === undefined) return "never read";
  return now - status.readAt < maxAge ? "fresh" : "stale";
}

function describe(event: AccountDataToolEvent): string {
  switch (event.type) {
    case "requested":
      return `${event.kind} ${short(event.accountUUID)} requested${event.append ? " (next page)" : ""} ${event.queryKey}`;
    case "received":
      return `${event.kind} ${short(event.accountUUID)} received from ${event.sourceId}${elapsed(event.elapsedMs)}${event.hasMore ? ", more" : ""}`;
    case "failed":
      return `${event.kind} ${short(event.accountUUID)} failed${elapsed(event.elapsedMs)}: ${event.error}`;
    case "source-call":
      return `${event.sourceId}.${event.batch ? "readBatch" : "read"}(${event.kind}) ${event.accounts} account(s)${elapsed(event.elapsedMs)}${event.failed ? `, ${event.failed} failed` : ""}`;
  }
}

const newestFirst = (events: readonly AccountDataToolEvent[]) =>
  events.reduceRight<AccountDataToolEvent[]>((reversed, event) => [...reversed, event], []);

function AccountData({ statuses, events, maxAge, onClearEvents }: AccountDataToolProps) {
  const now = useNow(1000);
  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex-shrink-0 body-3-semi-bold text-base">
        Reads · {statuses.length}
      </div>
      <div className="max-h-1/2 overflow-auto flex-shrink-0">
        <table className="w-full body-3 font-mono text-left">
          <thead className="text-muted">
            <tr>
              {["Kind", "Account", "State", "Source", "Read at", "Query", "More"].map(column => (
                <th key={column} className="px-12 py-6 border-b border-base font-normal">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-base">
            {statuses.map(status => (
              <tr key={`${status.kind}:${status.accountUUID}`} className="border-b border-base">
                <td className="px-12 py-6">{status.kind}</td>
                <td className="px-12 py-6 align-top" aria-label={status.accountUUID}>
                  <details>
                    <summary className="cursor-pointer">{short(status.accountUUID)}</summary>
                    <pre className="body-3 font-mono text-muted whitespace-pre-wrap break-all">
                      {status.accountUUID}
                      {status.descriptor ? `\n${status.descriptor}` : ""}
                    </pre>
                  </details>
                </td>
                <td className="px-12 py-6 align-top">
                  {stateOf(status, now, maxAge)}
                  {status.error ? <div className="text-error">{status.error}</div> : null}
                </td>
                <td className="px-12 py-6">{status.sourceId ?? "—"}</td>
                <td className="px-12 py-6">
                  {status.readAt === undefined ? "—" : time(status.readAt)}
                </td>
                <td className="px-12 py-6">{status.queryKey ?? "—"}</td>
                <td className="px-12 py-6">{status.hasMore ? "yes" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-16 py-8 border-y border-base flex items-center justify-between flex-shrink-0">
        <span className="body-3-semi-bold text-base">Events · {events.length}</span>
        <button type="button" onClick={onClearEvents} className="body-3-semi-bold text-base">
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-auto body-3 font-mono">
        {newestFirst(events).map(event => (
          <div key={event.id} className="px-16 py-4 border-b border-base flex gap-12">
            <span className="text-muted flex-shrink-0">{time(event.at)}</span>
            <span className={event.type === "failed" ? "text-error" : "text-base"}>
              {describe(event)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AccountData;
