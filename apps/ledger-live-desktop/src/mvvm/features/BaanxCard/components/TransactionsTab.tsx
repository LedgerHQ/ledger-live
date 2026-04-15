import React, { useState } from "react";
import {
  useCardTotalBalance,
  useCardTransactions as useCardTxHook,
  useCardTransactionFundingSources,
} from "@ledgerhq/baanx";
import type { CardTransaction } from "@ledgerhq/baanx";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function fmtAmount(amount?: number | null, currency?: string): string {
  if (amount === null || amount === undefined) return "—";
  const sign = amount < 0 ? "" : amount > 0 ? "+" : "";
  const display = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${sign}${display} ${currency}` : `${sign}${display}`;
}

function fmtDate(v?: unknown): string {
  if (!v) return "—";
  const s = String(v);
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

function StateBadge({ state }: { readonly state?: string }) {
  if (!state) return <span className="text-xs text-muted">—</span>;
  const lower = state.toLowerCase();
  const colors =
    lower === "confirmed" || lower === "completed" || lower === "approved" || lower === "settled"
      ? "bg-green-900/30 text-green-400 border-green-700/50"
      : lower === "pending" || lower === "processing" || lower === "authorized"
        ? "bg-yellow-900/30 text-yellow-400 border-yellow-700/50"
        : lower === "failed" || lower === "rejected" || lower === "declined"
          ? "bg-red-900/30 text-red-400 border-red-700/50"
          : "bg-neutral-800/50 text-neutral-300 border-neutral-600/50";
  return (
    <span className={`rounded-full border px-8 py-2 text-xs font-medium ${colors}`}>{state}</span>
  );
}

function Field({
  label,
  value,
  mono,
  truncate: trunc,
}: {
  readonly label: string;
  readonly value?: string | null;
  readonly mono?: boolean;
  readonly truncate?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span
        className={`text-sm ${mono ? "font-mono" : ""} ${trunc ? "max-w-[300px] truncate" : ""}`}
        title={trunc ? value ?? undefined : undefined}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function FundingSources({
  transactionId,
  accessToken,
}: {
  readonly transactionId: string;
  readonly accessToken: string;
}) {
  const { sources, isLoading } = useCardTransactionFundingSources(accessToken, transactionId);

  if (isLoading) return <div className="text-xs text-muted">Loading funding sources...</div>;
  if (sources.length === 0) return null;

  const filtered = sources.filter(isRecord);

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs font-semibold text-muted">Funding Sources</span>
      {filtered.map((src, i) => (
        <div key={i} className="rounded-sm border border-default bg-surface p-12 text-xs">
          <div className="grid grid-cols-2 gap-x-16 gap-y-4">
            {Object.entries(src).map(([k, v]) => (
              <Field
                key={k}
                label={k}
                value={typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const RAW_HEADER_FIELDS = new Set([
  "id",
  "card_id",
  "merchantNameLocation",
  "merchantType",
  "amountTransactionCurrency",
  "originalTransactionCurrency",
  "reversalAuthorizationId",
  "transaction_state",
]);

function TransactionCard({
  tx,
  accessToken,
}: {
  readonly tx: CardTransaction;
  readonly accessToken: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const extraFields = Object.entries(tx.raw).filter(([k]) => !RAW_HEADER_FIELDS.has(k));

  return (
    <div className="overflow-hidden rounded-sm border border-default">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-16 px-16 py-12 text-left transition-colors hover:bg-surface-hover"
      >
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-surface text-lg">
          :credit_card:
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-semibold">{tx.merchantName}</span>
          <div className="flex items-center gap-8 text-xs text-muted">
            <span>{tx.merchantType}</span>
            <span>·</span>
            <span>{fmtDate(tx.date)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-sm font-semibold ${
              tx.amount < 0 ? "text-red-400" : "text-green-400"
            }`}
          >
            {fmtAmount(tx.amount, tx.currency)}
          </span>
          <StateBadge state={tx.state} />
        </div>

        <span className="text-muted">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-16 border-t border-default px-16 py-16">
          <div className="grid grid-cols-3 gap-x-24 gap-y-12">
            <Field label="Transaction ID" value={tx.id} mono truncate />
            <Field label="Card ID" value={tx.cardId} mono truncate />
            <Field label="State" value={tx.state} />
            <Field label="Merchant" value={tx.merchantName} />
            <Field label="Merchant Type" value={tx.merchantType} />
            <Field label="Amount" value={fmtAmount(tx.amount, tx.currency)} />
            <Field label="Reversal ID" value={tx.reversalId ?? "None"} />
          </div>

          {extraFields.length > 0 && (
            <div className="flex flex-col gap-8">
              <span className="text-xs font-semibold text-muted">
                All Details ({extraFields.length} fields)
              </span>
              <div className="grid grid-cols-3 gap-x-24 gap-y-8">
                {extraFields.map(([k, v]) => (
                  <Field
                    key={k}
                    label={k}
                    value={typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                    mono={typeof v === "string" && String(v).length > 20}
                    truncate={typeof v === "string" && String(v).length > 30}
                  />
                ))}
              </div>
            </div>
          )}

          <FundingSources transactionId={tx.id} accessToken={accessToken} />
        </div>
      )}
    </div>
  );
}

interface TransactionsTabProps {
  readonly accessToken: string | null;
  readonly isAuthenticated: boolean;
  readonly fiatCurrency?: string;
}

export function TransactionsTab({
  accessToken,
  isAuthenticated,
  fiatCurrency,
}: TransactionsTabProps) {
  if (!isAuthenticated || !accessToken) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-32">
        <span className="body-2 text-muted">
          Log in to the Baanx app first, then switch to this tab.
        </span>
      </div>
    );
  }

  return <TransactionsContent accessToken={accessToken} fiatCurrency={fiatCurrency} />;
}

function BalanceCard({
  accessToken,
  fiatCurrency,
}: {
  readonly accessToken: string;
  readonly fiatCurrency?: string;
}) {
  const { wallets, totalFiatValue, fiatCurrency: resolvedFiat, isLoading } = useCardTotalBalance(
    accessToken,
    fiatCurrency,
  );

  if (isLoading) {
    return (
      <div className="rounded-sm border border-default bg-surface p-16">
        <span className="text-xs text-muted">Loading balance...</span>
      </div>
    );
  }

  if (wallets.length === 0) return null;

  return (
    <div className="flex flex-col gap-12 rounded-sm border border-default bg-surface p-16">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted">Total Balance</span>
          {totalFiatValue !== null ? (
            <span className="text-2xl font-bold">
              {totalFiatValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-sm font-medium text-muted">{resolvedFiat}</span>
            </span>
          ) : (
            <span className="text-sm text-muted">
              No fiat conversion available — showing crypto balances
            </span>
          )}
        </div>
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-surface text-2xl">
          :credit_card:
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        {wallets.map(w => (
          <div
            key={w.coin}
            className="flex items-center gap-6 rounded-sm border border-default px-10 py-4 text-xs"
          >
            <span className="font-semibold">{w.coin.toUpperCase()}</span>
            <span className="font-mono">
              {w.balance.toLocaleString("en-US", { maximumFractionDigits: 8 })}
            </span>
            {w.fiatValue !== null && (
              <span className="text-muted">
                (
                {w.fiatValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {` ${resolvedFiat}`})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionsContent({
  accessToken,
  fiatCurrency,
}: {
  readonly accessToken: string;
  readonly fiatCurrency?: string;
}) {
  const { transactions, isLoading, error } = useCardTxHook(accessToken);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-32">
        <span className="text-sm text-muted">Loading card transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 py-16">
        <span className="text-sm text-red-400">Failed to load card transactions</span>
        <pre className="max-h-[200px] overflow-auto rounded-sm border border-default bg-surface p-12 text-xs">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-8 py-32">
        <span className="text-sm text-muted">No card transactions found (last 90 days).</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16">
      <BalanceCard accessToken={accessToken} fiatCurrency={fiatCurrency} />

      <div className="flex items-center gap-12">
        <span className="body-2-semi-bold text-base">
          Card Transactions ({transactions.length})
        </span>
        <span className="text-xs text-muted">Last 90 days</span>
      </div>

      <div className="flex flex-col gap-8">
        {transactions.map(tx => (
          <TransactionCard key={tx.id} tx={tx} accessToken={accessToken} />
        ))}
      </div>
    </div>
  );
}
