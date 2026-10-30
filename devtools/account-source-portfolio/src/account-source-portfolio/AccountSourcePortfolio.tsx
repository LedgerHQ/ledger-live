import { Button } from "@ledgerhq/lumen-ui-react";
import type {
  PortfolioSourceToolAccount,
  PortfolioSourceToolActivity,
  PortfolioSourceToolOutcome,
  PortfolioSourceToolProps,
} from "../types";

const time = (at: number) => new Date(at).toLocaleTimeString();
const cell = "px-12 py-6";

const OUTCOMES = {
  served: { label: "served", className: "text-success" },
  waiting: { label: "fell through: waiting", className: "text-warning" },
  failed: { label: "fell through: error", className: "text-error" },
} as const;

function AccountSourcePortfolio(props: PortfolioSourceToolProps) {
  const { serviceUrl, enabled, listedAt, busy } = props;
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
          <Button size="sm" appearance="gray" onClick={props.onRefresh} disabled={busy}>
            Refresh
          </Button>
          <Button size="sm" appearance="gray" onClick={props.onReconcile} disabled={busy}>
            Reconcile
          </Button>
          {busy ? <span className="body-3 text-muted">talking to the service…</span> : null}
        </div>
        <div className="body-3 font-mono text-muted break-all">
          {serviceUrl}
          {listedAt === undefined ? "" : ` · listed ${time(listedAt)}`}
        </div>
      </div>
      <div className="max-h-1/2 overflow-auto flex-shrink-0">
        <table className="w-full body-3 font-mono text-left">
          <thead className="text-muted">
            <tr>
              {["Account", "Registration", "Service account", "Last read"].map(column => (
                <th key={column} className={`${cell} border-b border-base font-normal`}>
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
                <td className={cell}>service only</td>
                <td className={`${cell} break-all`}>
                  {extra.type} {extra.label}
                </td>
                <td className={cell} colSpan={2}>
                  no local account needs it: Reconcile removes it
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActivityLog activity={props.activity} />
    </div>
  );
}

function Registration({ supported, registered }: PortfolioSourceToolAccount) {
  if (!supported) return <span className="text-muted">not supported</span>;
  return (
    <span className={registered ? "text-success" : "text-warning"}>
      {registered ? "registered" : "not registered"}
    </span>
  );
}

function Outcome({ outcome }: Readonly<{ outcome?: PortfolioSourceToolOutcome }>) {
  if (!outcome) return <>—</>;
  const { label, className } = OUTCOMES[outcome.status];
  return (
    <>
      <span className={className}>{label}</span>
      <span className="text-muted">
        {" "}
        {outcome.rows} rows · {time(outcome.at)}
      </span>
      {outcome.detail ? <div className="text-muted">{outcome.detail}</div> : null}
    </>
  );
}

function AccountRow({ account }: Readonly<{ account: PortfolioSourceToolAccount }>) {
  return (
    <tr className="border-b border-base align-top">
      <td className={cell}>
        <div>{account.accountUUID.slice(0, 8)}</div>
        <div className="text-muted break-all">{account.label}</div>
      </td>
      <td className={cell}>
        <Registration {...account} />
      </td>
      <td className={`${cell} break-all`}>
        {account.serverAccountId ?? "—"}
        {account.serverAccountId ? (
          <div className="text-muted">{account.serverStatus ?? "not listed"}</div>
        ) : null}
      </td>
      <td className={cell}>
        <Outcome outcome={account.outcome} />
      </td>
    </tr>
  );
}

function ActivityLog({ activity }: Readonly<{ activity: readonly PortfolioSourceToolActivity[] }>) {
  return (
    <>
      <div className="px-16 py-8 border-y border-base flex-shrink-0 body-3-semi-bold text-base">
        Activity · {activity.length}
      </div>
      <div className="flex-1 overflow-auto body-3 font-mono">
        {[...activity].reverse().map(entry => (
          <div key={entry.id} className="px-16 py-4 border-b border-base flex gap-12">
            <span className="text-muted flex-shrink-0">{time(entry.at)}</span>
            <span className={entry.ok ? "text-base" : "text-error"}>{entry.summary}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default AccountSourcePortfolio;
