import { Button } from "@ledgerhq/lumen-ui-react";
import type {
  PortfolioSourceToolAccount,
  PortfolioSourceToolActivity,
  PortfolioSourceToolProps,
} from "../types";

const time = (at: number) => new Date(at).toLocaleTimeString();
const short = (uuid: string) => uuid.slice(0, 8);

const OUTCOME_CLASS = { ok: "text-success", pending: "text-warning", failed: "text-error" };

function ActionButton({
  label,
  onClick,
  disabled,
}: Readonly<{ label: string; onClick: () => void; disabled?: boolean }>) {
  return (
    <Button size="sm" appearance="gray" onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}

function AccountSourcePortfolio(props: PortfolioSourceToolProps) {
  const { serviceUrl, enabled, portfolioId, listedAt, serverStatuses, busy } = props;
  if (!serviceUrl) {
    return (
      <div className="px-16 py-10 body-3 text-muted select-text">
        PORTFOLIO_SERVICE_URL is empty: the Portfolio source cannot be injected. Set it in
        apps/ledger-live-desktop/.env and restart the dev server.
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex flex-col gap-6 flex-shrink-0">
        <div className="flex items-center gap-16 flex-wrap">
          <label className="body-3-semi-bold text-base flex items-center gap-6">
            <input
              type="checkbox"
              checked={enabled}
              onChange={event => props.onToggleEnabled(event.target.checked)}
            />
            <span>Inject in the router, ranked first</span>
          </label>
          <ActionButton label="Refresh" onClick={props.onRefresh} disabled={busy} />
          <ActionButton label="Reconcile" onClick={props.onReconcile} disabled={busy} />
          <ActionButton label="New portfolio" onClick={props.onNewPortfolio} disabled={busy} />
          {busy ? <span className="body-3 text-muted">talking to the service…</span> : null}
        </div>
        <div className="body-3 font-mono text-muted break-all">
          {serviceUrl} · portfolio {portfolioId ?? "not assigned yet"}
          {listedAt === undefined ? "" : ` · listed ${time(listedAt)}`}
        </div>
        {serverStatuses.length > 0 ? (
          <div className="body-3 font-mono text-muted">
            service accounts:{" "}
            {serverStatuses.map(({ status, count }) => `${count} ${status}`).join(", ")}
          </div>
        ) : null}
      </div>
      <div className="max-h-1/2 overflow-auto flex-shrink-0">
        <table className="w-full body-3 font-mono text-left">
          <thead className="text-muted">
            <tr>
              {["Account", "Registration", "Service accounts", "Last read"].map(column => (
                <th key={column} className="px-12 py-6 border-b border-base font-normal">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-base">
            {props.accounts.map(account => (
              <AccountRow key={account.accountUUID} account={account} />
            ))}
            {props.extraRegistrations.map(extra => (
              <tr key={extra.id} className="border-b border-base text-muted">
                <td className="px-12 py-6">service only</td>
                <td className="px-12 py-6 break-all">
                  {extra.type} {extra.label}
                </td>
                <td className="px-12 py-6" colSpan={2}>
                  no local account needs it: Reconcile removes it
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActivityLog activity={props.activity} onClear={props.onClearActivity} />
    </div>
  );
}

function registrationLabel({ registration, registered }: PortfolioSourceToolAccount) {
  if (!registration) return <span className="text-muted">no strategy</span>;
  return (
    <details>
      <summary className={`cursor-pointer ${registered ? "text-success" : "text-warning"}`}>
        {registered ? "registered" : "not registered"}
      </summary>
      <pre className="whitespace-pre-wrap break-all text-muted">{registration}</pre>
    </details>
  );
}

function AccountRow({ account }: Readonly<{ account: PortfolioSourceToolAccount }>) {
  const { outcome } = account;
  return (
    <tr className="border-b border-base align-top">
      <td className="px-12 py-6" aria-label={account.accountUUID}>
        <div>{short(account.accountUUID)}</div>
        <div className="text-muted break-all">{account.label}</div>
      </td>
      <td className="px-12 py-6">{registrationLabel(account)}</td>
      <td className="px-12 py-6 break-all">
        {account.serverAccounts.length === 0
          ? "—"
          : account.serverAccounts.map(server => (
              <div key={server.id}>
                {server.id} <span className="text-muted">{server.status}</span>
              </div>
            ))}
      </td>
      <td className="px-12 py-6">
        {outcome ? (
          <>
            <span className={OUTCOME_CLASS[outcome.outcome]}>{outcome.outcome}</span>
            <span className="text-muted">
              {" "}
              {outcome.rows} rows · {time(outcome.at)}
            </span>
            {outcome.detail ? <div className="text-muted break-all">{outcome.detail}</div> : null}
          </>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

function ActivityLog({
  activity,
  onClear,
}: Readonly<{ activity: readonly PortfolioSourceToolActivity[]; onClear: () => void }>) {
  return (
    <>
      <div className="px-16 py-8 border-y border-base flex items-center justify-between flex-shrink-0">
        <span className="body-3-semi-bold text-base">Activity · {activity.length}</span>
        <ActionButton label="Clear" onClick={onClear} />
      </div>
      <div className="flex-1 overflow-auto body-3 font-mono">
        {activity
          .map((_, index) => activity[activity.length - 1 - index])
          .map(entry => (
            <div key={entry.id} className="px-16 py-4 border-b border-base flex gap-12">
              <span className="text-muted flex-shrink-0">{time(entry.at)}</span>
              <span className="text-muted flex-shrink-0 w-64">{entry.kind}</span>
              <span className={entry.ok ? "text-base" : "text-error"}>
                {entry.summary}
                {entry.durationMs === undefined ? "" : ` (${entry.durationMs} ms)`}
              </span>
            </div>
          ))}
      </div>
    </>
  );
}

export default AccountSourcePortfolio;
