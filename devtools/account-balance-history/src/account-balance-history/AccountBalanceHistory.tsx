import type {
  AccountBalanceHistoryToolAccount,
  AccountBalanceHistoryToolProps,
  AccountBalanceHistoryToolSeries,
} from "../types";

function AccountBalanceHistory({
  ranges,
  range,
  onRangeChange,
  accounts,
  onRead,
  onReadAll,
  fiat,
  countervalue,
  onCountervalueChange,
}: AccountBalanceHistoryToolProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex items-center gap-12 flex-shrink-0">
        <span className="flex-1 body-3 text-muted">
          {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </span>
        <label className="body-3 text-muted flex items-center gap-4">
          Range
          <select
            value={range}
            onChange={event => onRangeChange(event.target.value)}
            className="body-3 text-base"
          >
            {ranges.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label
          className="flex items-center gap-4 body-3 text-muted"
          title="The app's countervalue: change it in Settings"
        >
          <input
            type="checkbox"
            checked={countervalue}
            onChange={event => onCountervalueChange(event.target.checked)}
          />
          {fiat}
        </label>
        <button type="button" onClick={onReadAll} className="body-3-semi-bold text-base">
          Read all
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {accounts.length === 0 ? (
          <div className="px-16 py-10 body-3 text-muted">No account in the accounts slice.</div>
        ) : null}
        {accounts.map(account => (
          <AccountRow key={account.accountUUID} account={account} onRead={onRead} />
        ))}
      </div>
    </div>
  );
}

function readLabel({ reading, sourceId, readAt }: AccountBalanceHistoryToolAccount): string {
  if (reading) return "reading…";
  if (readAt === undefined) return "never read";
  return `${sourceId ?? "?"} · ${new Date(readAt).toLocaleTimeString()}`;
}

function AccountRow({
  account,
  onRead,
}: Readonly<{ account: AccountBalanceHistoryToolAccount; onRead: (accountUUID: string) => void }>) {
  const { accountUUID, descriptor, reading, error, series } = account;
  return (
    <div className="px-16 py-10 border-b border-base flex flex-col gap-4">
      <div className="flex items-center gap-12">
        <details className="flex-1 min-w-0 body-3-semi-bold text-base font-mono break-all">
          <summary className="cursor-pointer">{accountUUID}</summary>
          {descriptor ? (
            <pre className="body-3 font-mono text-muted whitespace-pre-wrap break-all">
              {descriptor}
            </pre>
          ) : null}
        </details>
        <span className="body-3 text-muted">{readLabel(account)}</span>
        <button
          type="button"
          disabled={reading}
          onClick={() => onRead(accountUUID)}
          className="body-3-semi-bold text-base"
        >
          Read
        </button>
      </div>
      {error ? <div className="body-3 text-error">{error}</div> : null}
      {series?.map(row => (
        <SeriesRow key={row.assetId} series={row} />
      ))}
    </div>
  );
}

const WIDTH = 160;
const HEIGHT = 24;

function sparklinePoints(values: readonly number[]): string {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;
  return values
    .map((value, index) => `${index * step},${HEIGHT - ((value - min) / span) * HEIGHT}`)
    .join(" ");
}

function SeriesRow({ series }: Readonly<{ series: AccountBalanceHistoryToolSeries }>) {
  const {
    assetId,
    pointCount,
    firstDate,
    lastDate,
    firstBalance,
    lastBalance,
    values,
    valuedCount,
    lastCountervalue,
    countervalues,
  } = series;
  const drawn = countervalues ?? values;
  return (
    <details className="body-3 font-mono">
      <summary className="cursor-pointer flex items-center gap-12">
        <span className="flex-1 min-w-0 break-all text-muted">{assetId}</span>
        {drawn.length > 1 ? (
          <svg width={WIDTH} height={HEIGHT} className="text-base flex-shrink-0">
            <title>{`${assetId} ${countervalues ? "value" : "balance"} over the range`}</title>
            <polyline
              points={sparklinePoints(drawn)}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
            />
          </svg>
        ) : null}
        <span className="body-3-semi-bold text-base">{lastBalance ?? "no point"}</span>
        {lastCountervalue ? (
          <span className="body-3-semi-bold text-success">{lastCountervalue}</span>
        ) : null}
      </summary>
      <div className="pl-16 text-muted break-all">
        <div>
          {pointCount} {pointCount === 1 ? "point" : "points"}
          {valuedCount === undefined ? "" : `, ${valuedCount} valued`}
        </div>
        {firstDate ? (
          <div>
            from {firstDate} {firstBalance}
          </div>
        ) : null}
        {lastDate ? (
          <div>
            to {lastDate} {lastBalance}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export default AccountBalanceHistory;
