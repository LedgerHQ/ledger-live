import { useState } from "react";
import type { AccountDiscoveryToolProps } from "../types";
import { formatDuration, statusLine } from "./summary";

const FIELD = "bg-base border border-base rounded px-8 py-4 body-3 text-base";
const clamp = (value: string, max: number) =>
  Math.min(max, Math.max(1, Math.floor(Number(value)) || 1));
const BUTTON = "px-12 py-4 rounded border border-base body-3 disabled:opacity-50";

function AccountDiscovery({
  currencies,
  state,
  onScan,
  onStop,
  blockedReason,
}: AccountDiscoveryToolProps) {
  const [currencyId, setCurrencyId] = useState(currencies[0]?.id ?? "");
  const [windowSize, setWindowSize] = useState(1);
  const [lookahead, setLookahead] = useState(1);
  const scanning = state.status === "scanning";

  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex-shrink-0 flex flex-col gap-8">
        <p className="body-3 text-muted">
          Open the currency app on the device, then scan. <code>window</code> derives that many
          accounts before asking their existence in one tick; <code>lookahead</code> keeps that many
          windows in flight. Neither changes the accounts found.
        </p>
        {blockedReason ? <p className="body-3 text-warning">{blockedReason}</p> : null}
        <div className="flex items-center gap-12 flex-wrap">
          <select
            aria-label="Currency"
            className={FIELD}
            value={currencyId}
            onChange={e => setCurrencyId(e.target.value)}
            disabled={scanning}
          >
            {currencies.map(currency => (
              <option key={currency.id} value={currency.id}>
                {currency.name}
              </option>
            ))}
          </select>
          <label className="body-3 flex items-center gap-8">
            <span>window</span>
            <input
              type="number"
              min={1}
              max={32}
              className={`${FIELD} w-64`}
              value={windowSize}
              onChange={e => setWindowSize(clamp(e.target.value, 32))}
              disabled={scanning}
            />
          </label>
          <label className="body-3 flex items-center gap-8">
            <span>lookahead</span>
            <input
              type="number"
              min={1}
              max={16}
              className={`${FIELD} w-64`}
              value={lookahead}
              onChange={e => setLookahead(clamp(e.target.value, 16))}
              disabled={scanning}
            />
          </label>
          {scanning ? (
            <button type="button" className={BUTTON} onClick={onStop}>
              Stop
            </button>
          ) : (
            <button
              type="button"
              className={BUTTON}
              onClick={() => onScan(currencyId, { window: windowSize, lookahead })}
              disabled={blockedReason !== undefined || currencyId === ""}
            >
              Scan
            </button>
          )}
        </div>
        <span className={`body-4 ${state.status === "error" ? "text-error" : "text-muted"}`}>
          {statusLine(state)}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        {state.rows.length === 0 ? (
          <p className="px-16 py-8 body-3 text-muted">No account yet.</p>
        ) : (
          <table className="w-full table-fixed body-3">
            <tbody>
              {state.rows.map(row => (
                <tr key={row.key} className="border-b border-base">
                  <td className="px-8 py-6 align-top w-1/5">
                    <span>
                      {row.derivationMode === "" ? "default" : row.derivationMode} #{row.index}
                    </span>
                    <span className={row.used ? " text-success" : " text-muted"}>
                      {row.used ? " used" : " new"}
                    </span>
                  </td>
                  <td className="px-8 py-6 align-top break-all font-mono">{row.descriptor}</td>
                  <td className="px-8 py-6 align-top w-80 text-muted tabular-nums">
                    +{formatDuration(row.foundAtMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AccountDiscovery;
