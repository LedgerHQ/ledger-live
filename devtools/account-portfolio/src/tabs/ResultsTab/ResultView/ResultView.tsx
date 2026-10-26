import type { ReactNode } from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";
import type {
  AccountPortfolioView,
  PortfolioAssetView,
  PortfolioBalanceFailureView,
  PortfolioOperationView,
} from "../../../types";
import { AssetIcon } from "../../../components/AssetIcon/AssetIcon";
import { BalanceSummary } from "../../../components/BalanceSummary/BalanceSummary";
import { formatAmount, formatCurrencyValue, shorten } from "../../../utils/format";
import { AccountStatusTag, BalanceStatusTag } from "../../../components/StatusTag/StatusTag";
import { balanceTotals, mergeBalances, type BalanceRowModel } from "../../../utils/mergeBalances";

function Row({
  icon,
  title,
  description,
  trailing,
}: Readonly<{ icon: ReactNode; title: ReactNode; description?: ReactNode; trailing?: ReactNode }>) {
  return (
    <div className="flex items-center gap-12 border-b border-muted-subtle py-8">
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="body-2-semi-bold break-all text-base">{title}</div>
        {description ? <div className="body-3 break-all text-muted">{description}</div> : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4">{trailing}</div>
    </div>
  );
}

// An asset CAL does not know has no ticker, and its id (a contract address) is long.
const symbolOf = (asset: PortfolioAssetView) => asset.ticker ?? shorten(asset.asset, 8);

function Amount({ asset, currency }: Readonly<{ asset: PortfolioAssetView; currency: string }>) {
  const value = formatCurrencyValue(asset.currencyValue, currency);
  const negative = asset.amount.startsWith("-");
  return (
    <span className={negative ? "text-error" : "text-base"}>
      {formatAmount(asset.amount, asset.decimals)} {symbolOf(asset)}
      {value ? <span className="text-muted"> · {value}</span> : null}
    </span>
  );
}

function BalanceRow({ row, currency }: Readonly<{ row: BalanceRowModel; currency: string }>) {
  const { entry, pending } = row;
  return (
    <Row
      icon={<AssetIcon network={entry.network} calId={entry.calId} ticker={entry.ticker} />}
      title={<Amount asset={entry} currency={currency} />}
      description={`${entry.name ?? symbolOf(entry)} · ${entry.network} · account ${shorten(entry.accountId)}`}
      trailing={
        <>
          {row.pendingOnly ? <BalanceStatusTag status="pending" /> : null}
          {pending ? (
            <Tag
              appearance="warning"
              size="sm"
              label={`Pending ${formatAmount(pending.amount, pending.decimals)} ${symbolOf(pending)}`}
            />
          ) : null}
          {entry.locked ? <Tag appearance="gray" size="sm" label="Locked" /> : null}
          {entry.estimated ? <Tag appearance="gray" size="sm" label="Estimated" /> : null}
        </>
      }
    />
  );
}

function OperationRow({
  operation,
  currency,
}: Readonly<{ operation: PortfolioOperationView; currency: string }>) {
  const lead = operation.deltas[0];
  return (
    <Row
      icon={<AssetIcon network={operation.network} calId={lead?.calId} ticker={lead?.ticker} />}
      title={
        operation.deltas.length === 0 ? (
          <span className="text-muted">No balance change</span>
        ) : (
          <div className="flex flex-col gap-2">
            {operation.deltas.map(delta => (
              <Amount key={delta.asset} asset={delta} currency={currency} />
            ))}
          </div>
        )
      }
      description={`${new Date(operation.time).toLocaleString()} · ${shorten(operation.hash)} · fee ${formatAmount(operation.fee.amount, operation.fee.decimals)} ${symbolOf(operation.fee)}`}
      trailing={
        operation.failed ? (
          <Tag appearance="error" size="sm" label="Failed" />
        ) : (
          <Tag
            appearance={operation.pending ? "warning" : "success"}
            size="sm"
            label={operation.pending ? "Pending" : "Confirmed"}
          />
        )
      }
    />
  );
}

function FailureRows({ failures }: Readonly<{ failures: readonly PortfolioBalanceFailureView[] }>) {
  return failures.map(failure => (
    <Row
      key={failure.accountId}
      icon={<AssetIcon network={failure.network} />}
      title={<span className="font-mono">{shorten(failure.accountId, 10)}</span>}
      description={failure.error}
      trailing={<Tag appearance="error" size="sm" label="Not read" />}
    />
  ));
}

type ViewOf<K extends AccountPortfolioView["kind"]> = Extract<AccountPortfolioView, { kind: K }>;

function RegistrationRows({
  entries,
}: Readonly<{ entries: ViewOf<"portfolio">["registrationEntries"] }>) {
  if (entries.length === 0) return null;
  return (
    <>
      <div className="pt-8 body-3-semi-bold text-muted">
        Registrations: the id on each line is what Remove registrations takes
      </div>
      <ScrollList>
        {entries.map(registration => (
          <Row
            key={registration.id}
            icon={<Tag appearance="gray" size="sm" label={registration.type} />}
            title={<span className="font-mono">{shorten(registration.detail, 14)}</span>}
            description={<span className="font-mono">{registration.id}</span>}
          />
        ))}
      </ScrollList>
      <div className="pt-8 body-3-semi-bold text-muted">Accounts the service tracks</div>
    </>
  );
}

function PortfolioResult({ view }: Readonly<{ view: ViewOf<"portfolio"> }>) {
  return (
    <div className="flex flex-col">
      <div className="body-3 text-muted">
        Portfolio <span className="font-mono">{view.id}</span> · {view.registrations}{" "}
        registration(s)
      </div>
      <RegistrationRows entries={view.registrationEntries} />
      {view.accounts.length === 0 ? (
        <div className="py-8 body-3 text-muted">
          No account yet: register some from the Portfolio tab.
        </div>
      ) : null}
      <ScrollList>
        {view.accounts.map(account => (
          <Row
            key={account.id}
            icon={<AssetIcon network={account.network} />}
            title={<span className="font-mono">{shorten(account.id, 10)}</span>}
            description={account.network}
            trailing={<AccountStatusTag status={account.status} />}
          />
        ))}
      </ScrollList>
    </div>
  );
}

function AccountResult({ view }: Readonly<{ view: ViewOf<"account"> }>) {
  return (
    <Row
      icon={<AssetIcon network={view.network} />}
      title={<span className="font-mono">{view.id}</span>}
      description={view.network}
      trailing={<AccountStatusTag status={view.status} />}
    />
  );
}

function BalanceResult({
  view,
  currency,
}: Readonly<{ view: ViewOf<"balance">; currency: string }>) {
  const rows = mergeBalances(view.entries);
  return (
    <div className="flex flex-col gap-8">
      <BalanceSummary totals={balanceTotals(rows)} currency={currency} />
      {rows.length === 0 && view.failures.length === 0 ? (
        <div className="py-8 body-3 text-muted">No balance entry.</div>
      ) : null}
      <ScrollList>
        {rows.map(row => (
          <BalanceRow
            key={`${row.entry.accountId}:${row.entry.asset}:${row.entry.locked}`}
            row={row}
            currency={currency}
          />
        ))}
        <FailureRows failures={view.failures} />
      </ScrollList>
      {view.hasMore ? <MoreTag /> : null}
    </div>
  );
}

function HistoryResult({
  view,
  currency,
}: Readonly<{ view: ViewOf<"history">; currency: string }>) {
  return (
    <div className="flex flex-col gap-8">
      {view.points.length === 0 && view.failures.length === 0 ? (
        <div className="py-8 body-3 text-muted">No balance history over this range.</div>
      ) : null}
      <ScrollList>
        {view.points.map(point => (
          <Row
            key={`${point.accountId}:${point.asset}:${point.time}`}
            icon={<AssetIcon network={point.network} calId={point.calId} ticker={point.ticker} />}
            title={<Amount asset={point} currency={currency} />}
            description={`${new Date(point.time).toLocaleString()} · ${point.name ?? symbolOf(point)} · account ${shorten(point.accountId)}`}
          />
        ))}
        <FailureRows failures={view.failures} />
      </ScrollList>
      {view.hasMore ? <MoreTag /> : null}
    </div>
  );
}

function UpdatesResult({
  view,
  currency,
}: Readonly<{ view: ViewOf<"updates">; currency: string }>) {
  return (
    <div className="flex flex-col">
      {view.operations.length === 0 ? (
        <div className="py-8 body-3 text-muted">No operation.</div>
      ) : null}
      <ScrollList>
        {view.operations.map(operation => (
          <OperationRow
            key={`${operation.accountId}:${operation.hash}`}
            operation={operation}
            currency={currency}
          />
        ))}
      </ScrollList>
      {view.hasMore ? <MoreTag /> : null}
    </div>
  );
}

export function ResultView({
  view,
  currency,
}: Readonly<{ view: AccountPortfolioView; currency: string }>) {
  switch (view.kind) {
    case "portfolio":
      return <PortfolioResult view={view} />;
    case "account":
      return <AccountResult view={view} />;
    case "balance":
      return <BalanceResult view={view} currency={currency} />;
    case "history":
      return <HistoryResult view={view} currency={currency} />;
    case "updates":
      return <UpdatesResult view={view} currency={currency} />;
  }
}

/** A long list scrolls inside the result, so the page does not have to. */
function ScrollList({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex max-h-400 flex-col overflow-y-auto pr-8">{children}</div>;
}

function MoreTag() {
  return (
    <div className="flex pt-8">
      <Tag appearance="gray" size="sm" label="More pages available" />
    </div>
  );
}
