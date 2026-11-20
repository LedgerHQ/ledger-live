import { useState } from "react";
import type { CryptoCurrencyId } from "@domain/entity-currency-crypto";
import type { AccountDiscoveryToolProps, DiscoveredRow } from "../types";
import { completionLabel, completionLine, formatDuration, statusLine } from "./summary";

const FIELD = "bg-base border border-base rounded px-8 py-4 body-3 text-base";
const BUTTON = "px-12 py-4 rounded border border-base body-3 disabled:opacity-50";

const rowName = (row: DiscoveredRow) =>
  `${row.derivationMode === "" ? "default" : row.derivationMode} #${row.index}`;

const COMPLETION_TONE: Partial<Record<NonNullable<DiscoveredRow["completion"]>, string>> = {
  completed: "text-success",
  refused: "text-warning",
  failed: "text-error",
};

function AccountDiscovery({
  currencies,
  state,
  onScan,
  onToggle,
  onComplete,
  onAdd,
}: AccountDiscoveryToolProps) {
  // The scan state outlives this page: reopening it keeps the scanned currency picked.
  const [currencyId, setCurrencyId] = useState<CryptoCurrencyId | undefined>(
    state.currencyId ?? currencies[0]?.id,
  );
  const scanning = state.status === "scanning";
  const busy = scanning || state.completion.status === "completing";
  const completion = completionLine(state);

  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex-shrink-0 flex flex-col gap-8">
        <p className="body-3 text-muted">
          Each scan runs as a Device Intent: the executor connects the device and opens the currency
          app. Accounts are derived one at a time; the next one is derived while a status loads only
          when the gap limit guarantees the scan reaches it.
        </p>
        <div className="flex items-center gap-12 flex-wrap">
          <select
            aria-label="Currency"
            className={FIELD}
            value={currencyId ?? ""}
            onChange={e => setCurrencyId(currencies.find(({ id }) => id === e.target.value)?.id)}
            disabled={busy}
          >
            {currencies.map(currency => (
              <option key={currency.id} value={currency.id}>
                {currency.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={BUTTON}
            onClick={() => currencyId && onScan(currencyId)}
            disabled={!currencyId || busy}
          >
            Scan
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={onComplete}
            disabled={busy || state.selection.completable === 0}
          >
            Complete selected
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={onAdd}
            disabled={busy || state.adding || state.selection.addable === 0}
          >
            Add {state.selection.addable}
          </button>
        </div>
        <span className={`body-4 ${state.status === "error" ? "text-error" : "text-muted"}`}>
          {statusLine(state)}
        </span>
        {completion ? (
          <span
            className={`body-4 ${state.completion.status === "error" ? "text-error" : "text-muted"}`}
          >
            {completion}
          </span>
        ) : null}
        {state.notice ? <span className="body-4 text-muted">{state.notice}</span> : null}
      </div>
      <div className="flex-1 overflow-auto">
        {state.rows.length === 0 ? (
          <p className="px-16 py-8 body-3 text-muted">No account yet.</p>
        ) : (
          <table className="w-full table-fixed body-3">
            <tbody>
              {state.rows.map(row => {
                const label = completionLabel(row);
                return (
                  <tr key={row.key} className="border-b border-base">
                    <td className="px-8 py-6 align-top w-32">
                      <input
                        type="checkbox"
                        aria-label={`Select ${rowName(row)}`}
                        checked={row.selected ?? false}
                        disabled={busy || row.added || row.notAddable !== undefined}
                        onChange={() => onToggle(row.key)}
                      />
                    </td>
                    <td className="px-8 py-6 align-top w-1/5">
                      <span>{rowName(row)}</span>
                      <span className={row.used ? "text-success" : "text-muted"}>
                        {row.used ? " used" : " new"}
                      </span>
                      {row.gate ? <span className="text-warning"> · {row.gate}</span> : null}
                      {row.added ? <span className="text-muted"> · added</span> : null}
                      {row.notAddable ? (
                        <span className="text-warning"> · not addable here: {row.notAddable}</span>
                      ) : null}
                      {label ? (
                        <span
                          className={
                            (row.completion && COMPLETION_TONE[row.completion]) ?? "text-muted"
                          }
                        >
                          {" "}
                          · {label}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-8 py-6 align-top break-all font-mono">{row.descriptor}</td>
                    <td className="px-8 py-6 align-top w-80 text-muted tabular-nums">
                      +{formatDuration(row.foundAtMs)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AccountDiscovery;
