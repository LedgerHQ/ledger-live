import React, { useState } from "react";
import { Button, Divider, Tag } from "@ledgerhq/lumen-ui-react";
import type { AccountDiscoveryToolProps, DiscoveredRow } from "../types";
import { formatDuration, shorten, summaryLine } from "./AccountDiscovery.internals";

function Row({ row }: Readonly<{ row: DiscoveredRow }>) {
  return (
    <div className="flex items-center justify-between gap-16 py-8">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center gap-8 flex-wrap">
          <span className="body-2-semi-bold">
            {row.derivationMode === "" ? "default" : row.derivationMode} #{row.index}
          </span>
          {row.used ? (
            <Tag size="sm" appearance="success" label="used" />
          ) : (
            <Tag size="sm" appearance="gray" label="new" />
          )}
        </div>
        <code className="body-4 text-muted truncate" title={row.address}>
          {shorten(row.address, 18)}
        </code>
        <code className="body-4 text-muted">{row.path}</code>
      </div>
      <span className="body-4 text-muted tabular-nums whitespace-nowrap">
        +{formatDuration(row.foundAtMs)}
      </span>
    </div>
  );
}

export function AccountDiscovery(props: Readonly<AccountDiscoveryToolProps>) {
  const { currencies, state, onScan, onStop, blockedReason } = props;
  const [currencyId, setCurrencyId] = useState(currencies[0]?.id ?? "");
  const [lookahead, setLookahead] = useState(1);
  const scanning = state.status === "scanning";

  return (
    <div className="flex flex-col gap-16 overflow-y-auto p-16">
      <p className="body-3 text-muted m-0">
        Discovery runs through <code>@features/platform-account-discovery</code>: the device derives
        the accounts one at a time, and each is asked to the account data sources through{" "}
        <code>exists</code>. The rules are the legacy scan&apos;s. Open the currency app on the
        device first. A raised lookahead overlaps the existence checks and finds the same accounts.
      </p>

      {blockedReason ? <p className="body-3 text-warning m-0">{blockedReason}</p> : null}

      <div className="flex items-center gap-12 flex-wrap">
        <select
          aria-label="Currency"
          className="body-3 border border-base rounded-sm p-8 bg-canvas"
          value={currencyId}
          onChange={event => setCurrencyId(event.target.value)}
          disabled={scanning}
        >
          {currencies.map(currency => (
            <option key={currency.id} value={currency.id}>
              {currency.name}
            </option>
          ))}
        </select>
        <label className="body-3 flex items-center gap-8">
          lookahead
          <input
            type="number"
            min={1}
            max={16}
            className="body-3 border border-base rounded-sm p-8 w-64 bg-canvas"
            value={lookahead}
            onChange={event => setLookahead(Math.max(1, Number(event.target.value) || 1))}
            disabled={scanning}
          />
        </label>
        {scanning ? (
          <Button size="sm" appearance="gray" onClick={onStop}>
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onScan(currencyId, { lookahead })}
            disabled={blockedReason !== undefined || currencyId === ""}
          >
            Scan
          </Button>
        )}
      </div>

      <span className={`body-4 ${state.status === "error" ? "text-error" : "text-muted"}`}>
        {(() => {
          if (state.status === "idle") return "Pick a currency and scan.";
          if (state.status === "error") return state.error ?? "The scan failed.";
          const prefix = scanning ? "Scanning… " : "Done · ";
          return prefix + summaryLine(state);
        })()}
      </span>

      <Divider />

      {state.rows.length === 0 ? (
        <p className="body-3 text-muted m-0">No account yet.</p>
      ) : (
        <div className="flex flex-col">
          {state.rows.map((row, index) => (
            <React.Fragment key={row.key}>
              {index > 0 ? <Divider /> : null}
              <Row row={row} />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default AccountDiscovery;
