import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGetWalletTransactionsQuery } from "@ledgerhq/baanx";

interface QueryResult {
  readonly label: string;
  readonly data?: unknown;
  readonly isLoading: boolean;
  readonly error?: unknown;
}

function JsonViewer({ data }: { readonly data: unknown }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <pre className="max-h-[500px] overflow-auto rounded-sm border border-default bg-surface p-12 text-xs leading-relaxed">
      {text}
    </pre>
  );
}

function StatusBadge({ result }: { readonly result: QueryResult }) {
  if (result.isLoading) {
    return (
      <span className="rounded-sm bg-yellow-100 px-6 py-2 text-xs text-yellow-800">Loading...</span>
    );
  }
  if (result.error) {
    return <span className="rounded-sm bg-red-100 px-6 py-2 text-xs text-red-800">Error</span>;
  }
  if (result.data) {
    return <span className="rounded-sm bg-green-100 px-6 py-2 text-xs text-green-800">OK</span>;
  }
  return (
    <span className="rounded-sm bg-neutral-100 px-6 py-2 text-xs text-neutral-600">No data</span>
  );
}

function ResultCard({
  result,
  defaultOpen = true,
  children,
}: {
  readonly result: QueryResult;
  readonly defaultOpen?: boolean;
  readonly children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div className="rounded-sm border border-default">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-8 px-16 py-12 text-left hover:bg-surface-hover"
      >
        <span className="body-2-semi-bold flex-1 text-base">{result.label}</span>
        <StatusBadge result={result} />
        <span className="text-muted">{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && (
        <div className="border-t border-default px-16 py-12">
          {children ??
            (result.error ? (
              <JsonViewer data={result.error} />
            ) : result.data ? (
              <JsonViewer data={result.data} />
            ) : result.isLoading ? (
              <div className="py-8 text-center text-sm text-muted">Fetching data...</div>
            ) : (
              <div className="py-8 text-center text-sm text-muted">No data available</div>
            ))}
        </div>
      )}
    </div>
  );
}

// --- Wallet types ---

interface WalletInfo {
  address: string;
  coin: string;
  coin_ledger_name?: string;
  balance?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function extractWallets(walletsData: unknown): WalletInfo[] {
  if (!isRecord(walletsData)) return [];
  const wallets = Array.isArray(walletsData.wallets) ? walletsData.wallets : [];
  return wallets
    .filter((w): w is Record<string, unknown> => isRecord(w) && "address" in w && "coin" in w)
    .map(w => ({
      address: String(w.address),
      coin: String(w.coin),
      coin_ledger_name: w.coin_ledger_name ? String(w.coin_ledger_name) : undefined,
      balance: w.balance ? String(w.balance) : undefined,
    }));
}

// --- Aggregated transaction ---

interface AggregatedTx {
  wallet_coin: string;
  wallet_address: string;
  [key: string]: unknown;
}

function extractTransactions(data: unknown, wallet: WalletInfo): AggregatedTx[] {
  if (!isRecord(data)) return [];
  const txs = Array.isArray(data.transactions) ? data.transactions : [];
  return txs.filter(isRecord).map(tx => ({
    ...tx,
    wallet_coin: wallet.coin_ledger_name ?? wallet.coin,
    wallet_address: wallet.address,
  }));
}

const HIDDEN_KEYS = new Set(["wallet_coin", "wallet_address"]);

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function TransactionRow({ tx, index }: { readonly tx: AggregatedTx; readonly index: number }) {
  const [expanded, setExpanded] = useState(false);
  const fields = Object.entries(tx).filter(([k]) => !HIDDEN_KEYS.has(k));

  return (
    <div className="rounded-sm border border-default">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-8 px-12 py-8 text-left text-xs hover:bg-surface-hover"
      >
        <span className="font-mono text-muted">#{index + 1}</span>
        <span className="rounded-sm bg-surface px-4 py-1 font-mono">{tx.wallet_coin}</span>
        <span className="flex-1 truncate font-mono text-muted">
          {fields
            .slice(0, 4)
            .map(([k, v]) => `${k}: ${formatValue(v)}`)
            .join(" | ")}
        </span>
        <span className="text-muted">{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && (
        <div className="border-t border-default px-12 py-8">
          <table className="w-full text-xs">
            <tbody>
              {fields.map(([key, value]) => (
                <tr key={key} className="border-b border-default last:border-0">
                  <td className="w-[180px] py-4 pr-8 font-medium text-muted">{key}</td>
                  <td className="break-all py-4 font-mono">
                    {typeof value === "object" && value !== null ? (
                      <pre className="max-h-[200px] overflow-auto rounded-sm bg-surface p-4 text-xs">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      formatValue(value)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WalletTxFetcher({
  wallet,
  accessToken,
  onResult,
}: {
  readonly wallet: WalletInfo;
  readonly accessToken: string;
  readonly onResult: (walletKey: string, txs: AggregatedTx[], loading: boolean) => void;
}) {
  const { data, isLoading } = useGetWalletTransactionsQuery({
    accessToken,
    address: wallet.address,
    coin: wallet.coin,
  });

  const key = `${wallet.coin}-${wallet.address}`;

  useEffect(() => {
    const txs = data ? extractTransactions(data, wallet) : [];
    onResult(key, txs, isLoading);
  }, [data, isLoading, key, onResult, wallet]);

  return null;
}

function AggregatedTransactionsSection({
  wallets,
  accessToken,
}: {
  readonly wallets: WalletInfo[];
  readonly accessToken: string;
}) {
  const [allTxs, setAllTxs] = useState<Record<string, AggregatedTx[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const allTxsRef = useRef(allTxs);
  const loadingMapRef = useRef(loadingMap);

  const onResult = useCallback((walletKey: string, txs: AggregatedTx[], loading: boolean) => {
    const prevTxs = allTxsRef.current;
    const prevLoading = loadingMapRef.current;

    if (prevTxs[walletKey] !== txs) {
      const next = { ...prevTxs, [walletKey]: txs };
      allTxsRef.current = next;
      setAllTxs(next);
    }
    if (prevLoading[walletKey] !== loading) {
      const next = { ...prevLoading, [walletKey]: loading };
      loadingMapRef.current = next;
      setLoadingMap(next);
    }
  }, []);

  const aggregated = Object.values(allTxs)
    .flat()
    .sort((a, b) => {
      const da = String(a.created_at ?? a.dateTime ?? a.date ?? "");
      const db = String(b.created_at ?? b.dateTime ?? b.date ?? "");
      return db.localeCompare(da);
    });

  const anyLoading = Object.values(loadingMap).some(Boolean);
  const totalWallets = wallets.length;
  const loadedWallets = Object.keys(allTxs).length;

  return (
    <>
      {wallets.map(w => (
        <WalletTxFetcher
          key={`${w.coin}-${w.address}`}
          wallet={w}
          accessToken={accessToken}
          onResult={onResult}
        />
      ))}

      <ResultCard
        result={{
          label: `All Transactions (${aggregated.length} total across ${totalWallets} wallets)`,
          data: aggregated.length > 0 ? aggregated : undefined,
          isLoading: anyLoading,
          error: undefined,
        }}
        defaultOpen
      >
        {anyLoading && loadedWallets < totalWallets && (
          <div className="mb-8 text-xs text-muted">
            Loading wallets... ({loadedWallets}/{totalWallets})
          </div>
        )}

        {aggregated.length === 0 && !anyLoading ? (
          <div className="py-8 text-center text-sm text-muted">
            No transactions found across any wallet.
          </div>
        ) : aggregated.length > 0 ? (
          <div className="flex flex-col gap-8">
            {aggregated.map((tx, i) => (
              <TransactionRow key={i} tx={tx} index={i} />
            ))}
          </div>
        ) : null}
      </ResultCard>
    </>
  );
}

// --- Main ResultsTab ---

interface ResultsTabProps {
  readonly queries: QueryResult[];
  readonly isAuthenticated: boolean;
  readonly accessToken: string | null;
}

export function ResultsTab({ queries, isAuthenticated, accessToken }: ResultsTabProps) {
  if (!isAuthenticated || !accessToken) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-32">
        <span className="body-2 text-muted">
          Log in to the Baanx app first, then switch to this tab.
        </span>
      </div>
    );
  }

  const successCount = queries.filter(q => q.data && !q.error).length;
  const errorCount = queries.filter(q => q.error).length;
  const loadingCount = queries.filter(q => q.isLoading).length;

  const walletsQuery = queries.find(q => q.label === "User Wallets");
  const wallets = walletsQuery?.data ? extractWallets(walletsQuery.data) : [];

  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-center gap-12">
        <span className="body-2-semi-bold text-base">API Results</span>
        <span className="text-xs text-green-600">{successCount} OK</span>
        {errorCount > 0 && <span className="text-xs text-error">{errorCount} errors</span>}
        {loadingCount > 0 && <span className="text-xs text-muted">{loadingCount} loading</span>}
      </div>

      {wallets.length > 0 && (
        <AggregatedTransactionsSection wallets={wallets} accessToken={accessToken} />
      )}

      <div className="flex flex-col gap-8">
        {queries.map(q => (
          <ResultCard key={q.label} result={q} />
        ))}
      </div>
    </div>
  );
}
