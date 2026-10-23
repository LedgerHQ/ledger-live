import type { ReactNode } from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";
import type {
  AccountPortfolioView,
  PortfolioAssetView,
  PortfolioOperationView,
} from "../../../types";
import { AssetIcon } from "../../../components/AssetIcon";
import { BalanceChart } from "../../../components/BalanceChart";
import { BalanceSummary } from "../../../components/BalanceSummary";
import { formatAmount, formatCurrencyValue, shorten } from "../../../utils/format";
import { historySeries } from "../../../utils/historySeries";
import { AccountStatusTag, BalanceStatusTag } from "../../../components/StatusTag";
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

export function ResultView({
  view,
  currency,
}: Readonly<{ view: AccountPortfolioView; currency: string }>) {
  switch (view.kind) {
    case "portfolio":
      return (
        <div className="flex flex-col">
          <div className="body-3 text-muted">
            Portfolio <span className="font-mono">{view.id}</span> · {view.registrations}{" "}
            registration(s)
          </div>
          {view.registrationEntries.length > 0 ? (
            <>
              <div className="pt-8 body-3-semi-bold text-muted">
                Registrations: the id on each line is what Remove registrations takes
              </div>
              <ScrollList>
                {view.registrationEntries.map(registration => (
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
          ) : null}
          {view.accounts.length === 0 ? (
            <div className="py-8 body-3 text-muted">
              No account yet: register some from the Manage tab.
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
    case "account":
      return (
        <Row
          icon={<AssetIcon network={view.network} />}
          title={<span className="font-mono">{view.id}</span>}
          description={view.network}
          trailing={<AccountStatusTag status={view.status} />}
        />
      );
    case "balance": {
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
                key={`${row.entry.accountId}:${row.entry.asset}`}
                row={row}
                currency={currency}
              />
            ))}
            {view.failures.map(failure => (
              <Row
                key={failure.accountId}
                icon={<AssetIcon network={failure.network} />}
                title={<span className="font-mono">{shorten(failure.accountId, 10)}</span>}
                description={failure.error}
                trailing={<Tag appearance="error" size="sm" label="Not read" />}
              />
            ))}
          </ScrollList>
          {view.hasMore ? <MoreTag /> : null}
        </div>
      );
    }
    case "history": {
      const { samples, skipped } = historySeries(view.points);
      return (
        <div className="flex flex-col gap-8">
          <BalanceChart samples={samples} currency={currency} />
          {skipped > 0 ? (
            <div className="flex">
              <Tag appearance="gray" size="sm" label={`${skipped} points without a value`} />
            </div>
          ) : null}
          {view.points.length === 0 && view.failures.length === 0 ? (
            <div className="py-8 body-3 text-muted">No balance history over this range.</div>
          ) : null}
          <ScrollList>
            {view.points.map(point => (
              <Row
                key={`${point.accountId}:${point.asset}:${point.time}`}
                icon={
                  <AssetIcon network={point.network} calId={point.calId} ticker={point.ticker} />
                }
                title={<Amount asset={point} currency={currency} />}
                description={`${new Date(point.time).toLocaleString()} · ${point.name ?? symbolOf(point)} · account ${shorten(point.accountId)}`}
              />
            ))}
            {view.failures.map(failure => (
              <Row
                key={failure.accountId}
                icon={<AssetIcon network={failure.network} />}
                title={<span className="font-mono">{shorten(failure.accountId, 10)}</span>}
                description={failure.error}
                trailing={<Tag appearance="error" size="sm" label="Not read" />}
              />
            ))}
          </ScrollList>
          {view.hasMore ? <MoreTag /> : null}
        </div>
      );
    }
    case "networks":
      return (
        <div className="flex flex-col">
          <div className="body-3 text-muted">{view.networks.length} networks</div>
          <ScrollList>
            {view.networks.map(network => (
              <Row
                key={network}
                icon={<AssetIcon network={network} />}
                title={<span className="font-mono">{network}</span>}
              />
            ))}
          </ScrollList>
        </div>
      );
    case "validators":
      return (
        <div className="flex flex-col">
          {view.validators.length === 0 ? (
            <div className="py-8 body-3 text-muted">No validators for this network.</div>
          ) : null}
          <ScrollList>
            {view.validators.map(validator => (
              <Row
                key={validator.address}
                icon={<Tag appearance="gray" size="sm" label="Validator" />}
                title={validator.name}
                description={<span className="font-mono">{validator.address}</span>}
                trailing={
                  <>
                    {validator.apy === undefined ? null : (
                      <Tag appearance="success" size="sm" label={`APY ${validator.apy}%`} />
                    )}
                    {validator.commissionRate === undefined ? null : (
                      <Tag
                        appearance="gray"
                        size="sm"
                        label={`Commission ${validator.commissionRate}`}
                      />
                    )}
                  </>
                }
              />
            ))}
          </ScrollList>
          {view.next ? (
            <div className="pt-8 body-3 text-muted">
              Next page cursor: <span className="font-mono break-all">{view.next}</span>
            </div>
          ) : null}
        </div>
      );
    case "fields":
      return (
        <dl className="flex flex-col gap-12">
          {view.fields.map(field => (
            <div key={field.label} className="flex flex-col gap-2">
              <dt className="body-3 text-muted">{field.label}</dt>
              <dd
                className={
                  field.mono
                    ? "body-3 font-mono break-all whitespace-pre-wrap text-base"
                    : "body-2 text-base"
                }
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      );
    case "updates":
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
