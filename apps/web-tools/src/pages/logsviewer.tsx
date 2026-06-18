import React, { Component, useCallback, useMemo, useRef, useState } from "react";
import { ObjectInspector } from "react-inspector";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Button,
  IconButton,
  Tag,
  ThemeProvider,
  SegmentedControl,
  SegmentedControlButton,
  DotCount,
  useTheme,
} from "@ledgerhq/lumen-ui-react";
import {
  Copy,
  Check,
  ExternalLink,
  Refresh,
  ChevronDown,
  ChevronUp,
} from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { Account, AccountRaw, Operation } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  decodeAccountId,
  shortAddressPreview,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  getAddressExplorer,
  getDefaultExplorerView,
  getTransactionExplorer,
} from "@ledgerhq/live-common/explorers";
import { syncAccount } from "../logic/syncAccount";

type App = {
  name: string;
  updated: boolean;
  blocks: number;
  hash: string;
  version: string;
  availableVersion: string;
};
type Log = {
  type: string;
  level: string;
  pname: string;
  message: string;
  timestamp: string;
  index: number;
  error?: Error;
  data?: Data;
};

type Data = {
  deviceModelId?: string;
  deviceVersion?: string;
  modelIdList?: string[];
  result?: {
    installed?: App[];
    deviceModelId: string;
    firmware: {
      version: string;
    };
  };
};

type LogMeta = {
  env: { [key: string]: string };
  userAgent: string;
  accountsIds: string[];
};

//splits mobile acc string
function decodeMobileAccountId(message: string) {
  const temp = message.toString();
  const tempInput = temp.replace("schedule ", "");
  const accountList = tempInput
    .split(",")
    .map(account => account.trim())
    .filter(account => account !== "");
  return accountList;
}

const messageLenses: Record<string, (log: Log) => string> = {
  libcore: ({ message }) => {
    const i = message.indexOf("I: ");
    return i === -1 ? message : message.slice(i + 3);
  },
};

const dmkLoggerTags = ["live-dmk-logger", "DMK"]; // "live-dmk-logger" is kept for backward compatibility

function isDmkLog(log: Log): boolean {
  return typeof log.type === "string" && dmkLoggerTags.some(tag => log.type.startsWith(tag));
}

// Explorer links are built from an address. For these families the account id
// holds an xpub / public key rather than an address, so the link can't be built.
const NON_ADDRESS_ID_FAMILIES = new Set(["bitcoin", "cardano", "tezos", "stacks"]);

function explorerDisabledReason(currency: CryptoCurrency): string | null {
  if (!getDefaultExplorerView(currency)?.address)
    return "No block explorer configured for this currency";
  if (NON_ADDRESS_ID_FAMILIES.has(currency.family))
    return "Not available for this account type (the id holds an xpub / public key, not an address)";
  return null;
}

function explorerUrlFor(currency: CryptoCurrency, xpubOrAddress: string): string | null {
  const url = getAddressExplorer(getDefaultExplorerView(currency), xpubOrAddress);
  // mintscan explorers link addresses under /address, not /validators
  return url ? url.replace("validators", "address") : null;
}

function explorerTxUrlFor(currency: CryptoCurrency, hash: string): string | null {
  return getTransactionExplorer(getDefaultExplorerView(currency), hash) ?? null;
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // fall through to legacy path
  }
  const input = document.createElement("textarea");
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

// react-inspector (v4) supports a `theme` prop; follow Lumen's resolved color
// scheme via a single context so the many inspector instances in the
// virtualized table don't each call useTheme.
const InspectorThemeContext = React.createContext<"chromeLight" | "chromeDark">("chromeLight");

function ThemedInspector(props: React.ComponentProps<typeof ObjectInspector>) {
  const theme = React.useContext(InspectorThemeContext);
  return <ObjectInspector {...props} theme={theme} />;
}

// Parses an exported logs file. Supports a JSON array, an object wrapping an
// array, or newline-delimited JSON (skipping any non-JSON noise lines).
function parseLogs(txt: string): Log[] {
  let obj: unknown;
  try {
    obj = JSON.parse(txt);
  } catch {
    const parsed: unknown[] = [];
    txt
      .split(/\n/g)
      .map(l => l.trim())
      .filter(Boolean)
      .forEach(line => {
        try {
          parsed.push(JSON.parse(line));
        } catch {
          // skip non-JSON lines
        }
      });
    if (parsed.length === 0) {
      throw new Error("not valid JSON nor newline-delimited JSON");
    }
    obj = parsed;
  }
  const arr = Array.isArray(obj)
    ? obj
    : obj && typeof obj === "object"
      ? Object.values(obj as Record<string, unknown>).find(Array.isArray)
      : undefined;
  if (!Array.isArray(arr)) {
    throw new Error("expected a JSON array of log entries");
  }
  return (arr as Omit<Log, "index">[]).map((l, index) => ({ index, ...l }));
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <IconButton
      size="xs"
      appearance="no-background"
      aria-label={label}
      icon={done ? Check : Copy}
      tooltip
      tooltipText={done ? "Copied!" : label}
      onClick={() => {
        copyText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    />
  );
}

const OPS_PAGE_SIZE = 20;

function formatOpDate(date: Operation["date"]): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 19).replace("T", " ");
}

type SyncState =
  | { status: "idle" }
  | { status: "syncing" }
  | { status: "done"; account: Account }
  | { status: "error"; error: string };

function AccountRow({ id }: { id: string }) {
  const decoded = useMemo(() => {
    try {
      return decodeAccountId(id);
    } catch {
      return null;
    }
  }, [id]);
  const currency = decoded ? findCryptoCurrencyById(decoded.currencyId) : undefined;

  const [copied, setCopied] = useState<"id" | "address" | null>(null);
  const [sync, setSync] = useState<SyncState>({ status: "idle" });
  const [expanded, setExpanded] = useState(false);
  const [opsPage, setOpsPage] = useState(0);

  const explorerUrl =
    decoded && currency && !explorerDisabledReason(currency)
      ? explorerUrlFor(currency, decoded.xpubOrAddress)
      : null;

  const copy = (kind: "id" | "address", text: string) => {
    copyText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  const doSync = async () => {
    setSync({ status: "syncing" });
    try {
      const account = await syncAccount(id);
      setSync({ status: "done", account });
    } catch (e) {
      setSync({ status: "error", error: String((e as Error)?.message ?? e) });
    }
  };

  const balanceLabel =
    sync.status === "done" && currency
      ? formatCurrencyUnit(currency.units[0], sync.account.balance, { showCode: true })
      : null;

  const title = currency?.name ?? decoded?.currencyId ?? "Unknown";

  const operations = sync.status === "done" ? sync.account.operations : [];
  const pageCount = Math.max(1, Math.ceil(operations.length / OPS_PAGE_SIZE));
  const page = Math.min(opsPage, pageCount - 1);
  const pageOps = operations.slice(page * OPS_PAGE_SIZE, (page + 1) * OPS_PAGE_SIZE);
  const formatAmount = (value: Operation["value"]) =>
    currency ? formatCurrencyUnit(currency.units[0], value, { showCode: true }) : String(value);

  return (
    <div className="rounded-lg border border-base bg-base">
      <div className="flex flex-wrap items-center gap-12 px-12 py-8">
        {currency ? (
          <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={24} />
        ) : (
          <div className="size-24 shrink-0 rounded-full bg-muted" />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <span className="inline-flex items-center gap-4 body-2 text-base">
            {title}
            {decoded ? (
              <>
                <span className="text-muted">·</span>
                <IconButton
                  size="xs"
                  appearance="no-background"
                  aria-label="Copy address / xpub"
                  icon={copied === "address" ? Check : Copy}
                  tooltip
                  tooltipText={copied === "address" ? "Copied!" : "Copy address / xpub"}
                  onClick={() => copy("address", decoded.xpubOrAddress)}
                />
                <span className="font-mono text-muted">
                  {shortAddressPreview(decoded.xpubOrAddress)}
                </span>
                {explorerUrl ? (
                  <IconButton
                    size="xs"
                    appearance="no-background"
                    aria-label="Open in block explorer"
                    icon={ExternalLink}
                    tooltip
                    tooltipText="Open in block explorer"
                    onClick={() => window.open(explorerUrl, "_blank", "noopener,noreferrer")}
                  />
                ) : null}
              </>
            ) : null}
          </span>
          <span className="inline-flex items-center gap-4 body-4 font-mono text-muted">
            <IconButton
              size="xs"
              appearance="no-background"
              aria-label="Copy account id"
              icon={copied === "id" ? Check : Copy}
              tooltip
              tooltipText={copied === "id" ? "Copied!" : "Copy account id"}
              onClick={() => copy("id", id)}
            />
            <span className="truncate">{id}</span>
          </span>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-8">
          {sync.status === "done" && balanceLabel ? (
            <Tag appearance="success" size="sm" label={balanceLabel} />
          ) : sync.status === "error" ? (
            <span className="max-w-[280px] truncate body-4 text-error" title={sync.error}>
              {sync.error}
            </span>
          ) : null}

          {sync.status === "done" ? (
            <Button
              size="sm"
              appearance="no-background"
              icon={expanded ? ChevronUp : ChevronDown}
              onClick={() => setExpanded(e => !e)}
            >
              {operations.length} ops
            </Button>
          ) : null}

          <Button
            size="sm"
            appearance={sync.status === "error" ? "red" : "gray"}
            icon={Refresh}
            loading={sync.status === "syncing"}
            onClick={doSync}
          >
            {sync.status === "error" ? "Retry" : "Sync"}
          </Button>
        </div>
      </div>

      {sync.status === "done" && expanded ? (
        operations.length ? (
          <div className="flex flex-col gap-4 border-t border-base px-12 py-8">
            {pageOps.map(op => {
              const txUrl = currency ? explorerTxUrlFor(currency, op.hash) : null;
              return (
                <div key={op.id} className="flex items-center gap-8 body-4 font-mono">
                  <span className="shrink-0 text-muted">{formatOpDate(op.date)}</span>
                  <Tag size="sm" appearance="gray" label={op.type} />
                  <span className="shrink-0">{formatAmount(op.value)}</span>
                  <span className="truncate text-muted">{op.hash}</span>
                  <span className="ml-auto flex shrink-0 items-center">
                    <CopyIconButton value={op.hash} label="Copy tx hash" />
                    {txUrl ? (
                      <IconButton
                        size="xs"
                        appearance="no-background"
                        aria-label="Open tx in explorer"
                        icon={ExternalLink}
                        tooltip
                        tooltipText="Open tx in explorer"
                        onClick={() => window.open(txUrl, "_blank", "noopener,noreferrer")}
                      />
                    ) : null}
                  </span>
                </div>
              );
            })}
            {pageCount > 1 ? (
              <div className="flex items-center gap-8 pt-4 body-4 text-muted">
                <Button
                  size="sm"
                  appearance="no-background"
                  disabled={page === 0}
                  onClick={() => setOpsPage(page - 1)}
                >
                  Prev
                </Button>
                <span>
                  Page {page + 1} / {pageCount}
                </span>
                <Button
                  size="sm"
                  appearance="no-background"
                  disabled={page >= pageCount - 1}
                  onClick={() => setOpsPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="border-t border-base px-12 py-8 body-4 text-muted">No operations</div>
        )
      ) : null}
    </div>
  );
}

const PanelTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="heading-5 text-base">{children}</h2>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-12 rounded-lg border border-base bg-base p-16">
    <PanelTitle>{title}</PanelTitle>
    {children}
  </section>
);

// keys that are rendered as columns or are internal noise, not "extra data"
const HIDDEN_CONTENT_KEYS = new Set([
  "type",
  "level",
  "pname",
  "message",
  "timestamp",
  "index",
  "logIndex",
  "id",
  "date",
]);

function extraData(log: Log): Record<string, unknown> {
  return Object.fromEntries(Object.entries(log).filter(([key]) => !HIDDEN_CONTENT_KEYS.has(key)));
}

function LogContent({ log }: { log: Log }) {
  const messageLens = messageLenses[log.type];
  const message = messageLens ? messageLens(log) : log.message;
  const extra = extraData(log);
  return (
    <>
      <code className="whitespace-pre-wrap break-all">{message}</code>
      {Object.keys(extra).length > 0 ? <ThemedInspector data={extra} /> : null}
    </>
  );
}

// mobile logs carry `date` instead of `timestamp`
const timeAccessor = (l: Log & { date?: string }) => l.timestamp ?? l.date ?? "";

const LOG_COLUMN_WIDTHS: Record<string, string> = {
  index: "64px",
  time: "230px",
  process: "170px",
  type: "180px",
  content: "minmax(320px, 1fr)",
};

const columnHelper = createColumnHelper<Log>();

// stable identity: a per-render getRowId busts TanStack's row-model memo
const getLogRowId = (row: Log) => String(row.index);

const RawLogsTable = ({ logs }: { logs: Log[] }) => {
  const hasProcess = useMemo(() => logs.some(l => l.pname), [logs]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor(row => String(row.index), {
        id: "index",
        header: "index",
        filterFn: "includesString",
      }),
      columnHelper.accessor(timeAccessor, {
        id: "time",
        header: "time",
        filterFn: "includesString",
      }),
      ...(hasProcess
        ? [
            columnHelper.accessor("pname", {
              id: "process",
              header: "process",
              filterFn: "includesString",
            }),
          ]
        : []),
      columnHelper.accessor("type", { header: "type", filterFn: "includesString" }),
      columnHelper.accessor("message", {
        id: "content",
        header: "Content",
        filterFn: "includesString",
        cell: info => <LogContent log={info.row.original} />,
      }),
    ],
    [hasProcess],
  );

  const table = useReactTable({
    data: logs,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getRowId: getLogRowId,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;
  const gridTemplateColumns = table
    .getVisibleLeafColumns()
    .map(c => LOG_COLUMN_WIDTHS[c.id] ?? "1fr")
    .join(" ");

  // key measurements by stable row id so cached heights follow content across
  // filtering (otherwise rows overlap when the filtered set changes)
  const getItemKey = useCallback((index: number) => rows[index]?.id ?? index, [rows]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    overscan: 12,
    getItemKey,
    measureElement: el => el?.getBoundingClientRect().height ?? 44,
  });

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
      <div className="sticky top-0 z-10 border-b border-base bg-canvas">
        <div className="grid" style={{ gridTemplateColumns }}>
          {table.getFlatHeaders().map(header => (
            <div key={header.id} className="px-8 py-4 body-4 font-medium text-muted">
              {String(header.column.columnDef.header)}
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns }}>
          {table.getFlatHeaders().map(header => (
            <div key={header.id} className="px-8 pb-4">
              <input
                aria-label={`Filter ${String(header.column.columnDef.header)}`}
                value={(header.column.getFilterValue() as string) ?? ""}
                onChange={e => header.column.setFilterValue(e.target.value)}
                placeholder="filter"
                className="w-full rounded border border-base bg-base px-4 py-2 body-4 text-base outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="grid border-b border-muted-subtle hover:bg-muted"
              style={{
                gridTemplateColumns,
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.getVisibleCells().map(cell => {
                const isContent = cell.column.id === "content";
                const value = String(cell.getValue() ?? "");
                return (
                  <div
                    key={cell.id}
                    title={isContent ? undefined : value}
                    className={`min-w-0 px-8 py-4 body-3 font-mono ${
                      isContent ? "break-all" : "truncate whitespace-nowrap"
                    }`}
                  >
                    {isContent ? flexRender(cell.column.columnDef.cell, cell.getContext()) : value}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

type TabId = "device" | "accounts" | "apdus" | "transactions" | "errors" | "raw";

function LogsDashboard({
  logs,
  logsMeta,
  onFiles,
}: {
  logs: Log[];
  logsMeta?: LogMeta;
  onFiles: (files: FileList) => void;
}) {
  const apdusLogs = useMemo(
    () =>
      logs
        .slice(0)
        .reverse()
        .filter(l => l.type === "apdu" || (isDmkLog(l) && l.message.startsWith("[exchange]")))
        // copy when stripping the prefix so we don't mutate the shared log objects
        .map(l => (isDmkLog(l) ? { ...l, message: l.message.replace(/^\[exchange\] /, "") } : l))
        .sort((a, b) => a.index - b.index)
        .reduce<Log[]>((all, l) => {
          const last = all[all.length - 1];
          if (last && last.message === l.message) return all;
          return all.concat(l);
        }, []),
    [logs],
  );
  const apdus = useMemo(() => apdusLogs.map(l => l.message).join("\n"), [apdusLogs]);
  const apdusHref = useMemo(() => "data:text/plain;base64," + btoa(apdus), [apdus]);

  const txSummaryLogs = useMemo(
    () =>
      logs
        .slice(0)
        .reverse()
        .filter(l => l.type === "transaction-summary"),
    [logs],
  );

  const experimentalEnvs = useMemo(() => {
    const res: Array<{ key: string; value: string }> = [];
    if (logsMeta) {
      Object.keys(logsMeta.env).forEach(key => {
        if (key.includes("EXPERIMENTAL") && logsMeta.env[key]) {
          res.push({ key, value: logsMeta.env[key] });
        }
      });
    }
    return res;
  }, [logsMeta]);

  const errors = useMemo(() => logs.filter(l => l.error), [logs]);

  const { installed, deviceLog, deviceModel, deviceVersion, listAccounts } = useMemo(() => {
    const installed = logs.find(log => log.data?.result?.installed)?.data?.result?.installed ?? [];
    const mobileModel = logs.find(log => log.data?.result?.deviceModelId);
    const mobileVersion = logs.find(log => log.data?.result?.firmware?.version);

    let deviceLog: Data | undefined = logs.find(
      log => log.data?.deviceModelId && log.data?.deviceVersion && log.data?.modelIdList,
    )?.data;
    let deviceModel: string | undefined;
    let deviceVersion: string | undefined;
    let listAccounts: string[] = [];

    if (logsMeta?.userAgent) {
      listAccounts = logsMeta.accountsIds ?? [];
      if (deviceLog) {
        deviceModel = deviceLog.deviceModelId;
        deviceVersion = deviceLog.deviceVersion;
      }
    } else {
      const scheduleLog = logs.find(
        log => typeof log.message === "string" && log.message.startsWith("schedule js:2"),
      );
      if (scheduleLog) {
        listAccounts = decodeMobileAccountId(scheduleLog.message);
        if (mobileModel) {
          deviceModel = mobileModel.data?.result?.deviceModelId;
          deviceVersion = mobileVersion?.data?.result?.firmware?.version;
          deviceLog = mobileModel.data;
        }
      }
    }

    return { installed, deviceLog, deviceModel, deviceVersion, listAccounts };
  }, [logs, logsMeta]);

  const accounts: { data: AccountRaw }[] | undefined = useMemo(() => {
    try {
      return listAccounts
        .map(id => {
          const { derivationMode, xpubOrAddress, currencyId } = decodeAccountId(id);
          const data: AccountRaw = {
            id,
            seedIdentifier: xpubOrAddress,
            xpub: xpubOrAddress,
            derivationMode,
            index: 0,
            freshAddress: xpubOrAddress,
            freshAddressPath: "0'/0'/0'/0/0", // intentionally wrong, account not in possession
            name: currencyId + " " + shortAddressPreview(xpubOrAddress),
            starred: true,
            balance: "0",
            blockHeight: 0,
            currencyId,
            operations: [],
            pendingOperations: [],
            swapHistory: [],
            lastSyncDate: "0",
          };
          return { data };
        })
        .filter(Boolean);
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }, [listAccounts]);

  const appJsonHref = useMemo(() => {
    try {
      return !accounts
        ? ""
        : "data:text/plain;base64," +
            btoa(
              JSON.stringify({
                data: {
                  settings: { hasCompletedOnboarding: true },
                  user: { id: "_" },
                  accounts,
                },
              }),
            );
    } catch (e) {
      console.error(e);
      return "";
    }
  }, [accounts]);

  const hasDeviceInfo =
    Boolean(deviceLog) ||
    installed.length > 0 ||
    experimentalEnvs.length > 0 ||
    Boolean(logsMeta?.userAgent);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "raw", label: "Raw logs", count: logs.length },
    ...(listAccounts.length
      ? [{ id: "accounts" as const, label: "Accounts", count: listAccounts.length }]
      : []),
    ...(hasDeviceInfo ? [{ id: "device" as const, label: "Device" }] : []),
    ...(apdusLogs.length
      ? [{ id: "apdus" as const, label: "APDUs", count: apdusLogs.length }]
      : []),
    ...(txSummaryLogs.length
      ? [{ id: "transactions" as const, label: "Transactions", count: txSummaryLogs.length }]
      : []),
    ...(errors.length ? [{ id: "errors" as const, label: "Errors", count: errors.length }] : []),
  ];

  const [tab, setTab] = useState<TabId>("raw");
  const activeTab = tabs.some(t => t.id === tab) ? tab : "raw";

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    e.target.files && onFiles(e.target.files);

  const isRaw = activeTab === "raw";
  const { colorScheme } = useTheme();
  const inspectorTheme = colorScheme === "dark" ? "chromeDark" : "chromeLight";

  return (
    <InspectorThemeContext.Provider value={inspectorTheme}>
      <div className="flex min-h-0 flex-1 flex-col gap-16">
        <div className="flex items-center gap-12">
          <Button asChild appearance="accent" size="sm" className="shrink-0">
            <label>
              Load Logs
              <input type="file" onChange={onChange} accept=".json,.txt" className="hidden" />
            </label>
          </Button>

          <SegmentedControl
            selectedValue={activeTab}
            onSelectedChange={v => setTab(v as TabId)}
            aria-label="Logs sections"
          >
            {tabs.map(t => (
              <SegmentedControlButton
                key={t.id}
                value={t.id}
                trailingContent={t.count != null ? <DotCount value={t.count} /> : undefined}
              >
                {t.label}
              </SegmentedControlButton>
            ))}
          </SegmentedControl>
        </div>

        <div
          className={isRaw ? "-mx-24 flex min-h-0 flex-1 flex-col" : "min-h-0 flex-1 overflow-auto"}
        >
          {activeTab === "device" ? (
            <div className="flex flex-col gap-16">
              {logsMeta?.userAgent ? (
                <Section title="User agent">
                  <p className="body-3 font-mono text-muted break-all">{logsMeta.userAgent}</p>
                </Section>
              ) : null}
              {deviceLog ? (
                <Section title="Device">
                  <div className="body-2 text-base">
                    Last connected: <span className="font-medium">{deviceModel}</span>
                    {deviceVersion ? <span className="text-muted"> · {deviceVersion}</span> : null}
                  </div>
                  {deviceLog.modelIdList && deviceLog.modelIdList.length > 0 ? (
                    <div className="flex flex-wrap gap-8">
                      {deviceLog.modelIdList.map((modelId, i) => (
                        <Tag key={i} appearance="gray" size="sm" label={modelId} />
                      ))}
                    </div>
                  ) : null}
                </Section>
              ) : null}

              {installed.length ? (
                <Section title={`Installed apps (${installed.length})`}>
                  <p className="body-4 text-muted">
                    Apps may report &quot;latest version&quot; even when outdated if the firmware
                    itself is outdated.
                  </p>
                  <div className="flex flex-col gap-4">
                    {installed.map((app, i) => (
                      <div key={i} className="flex items-center gap-8 body-3">
                        <span className="font-mono text-base">{app.name}</span>
                        <span className="text-muted">{app.version}</span>
                        <Tag
                          size="sm"
                          appearance={app.updated ? "success" : "warning"}
                          label={app.updated ? "latest" : `${app.availableVersion} available`}
                        />
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {experimentalEnvs.length ? (
                <Section title={`Experimental envs (${experimentalEnvs.length})`}>
                  <div className="flex flex-col gap-4 font-mono body-4">
                    {experimentalEnvs.map((env, i) => (
                      <div key={i}>
                        <span className="text-base">{env.key}</span>
                        <span className="text-muted">: {env.value}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}
            </div>
          ) : null}

          {activeTab === "accounts" ? (
            <div className="flex flex-col gap-8">
              {accounts?.length ? (
                <Button asChild appearance="gray" size="sm" className="self-start">
                  <a download="app.json" href={appJsonHref}>
                    Export app.json with these accounts
                  </a>
                </Button>
              ) : null}
              {listAccounts.map(id => (
                <AccountRow key={id} id={id} />
              ))}
            </div>
          ) : null}

          {activeTab === "apdus" ? (
            <Section title={`APDUs (${apdusLogs.length})`}>
              <Button asChild appearance="gray" size="sm" className="self-start">
                <a download="apdus" href={apdusHref}>
                  Download apdus
                </a>
              </Button>
              <pre className="max-h-[60vh] overflow-auto rounded-lg border border-base bg-muted p-16 body-4 font-mono text-base">
                <code>{apdus}</code>
              </pre>
            </Section>
          ) : null}

          {activeTab === "transactions" ? (
            <div className="flex flex-col gap-8">
              {txSummaryLogs.map(
                ({ type, level, pname, message, timestamp, index: _index, ...rest }, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-8 rounded-lg border border-base bg-base p-16"
                  >
                    <pre className="overflow-auto body-4 font-mono text-base">{message}</pre>
                    {Object.keys(rest).length > 0 ? <ThemedInspector data={rest} /> : null}
                  </div>
                ),
              )}
            </div>
          ) : null}

          {activeTab === "errors" ? (
            <div className="flex flex-col gap-8">
              {errors.map((e, i) => (
                <div key={i} className="rounded-lg border border-base bg-base p-16">
                  <ThemedInspector data={e.error} expandLevel={3} />
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "raw" ? <RawLogsTable logs={logs} /> : null}
        </div>
      </div>
    </InspectorThemeContext.Provider>
  );
}

function EmptyState({ onFiles }: { onFiles: (files: FileList) => void }) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    e.target.files && onFiles(e.target.files);
  return (
    <div className="flex flex-col items-center gap-16 rounded-lg border border-base bg-base p-32 text-center">
      <h1 className="heading-3 text-base">
        Ledger <strong>Live</strong> LogsViewer
      </h1>
      <p className="body-2 text-muted">
        Drop or select a <code className="font-mono">*.json</code> /{" "}
        <code className="font-mono">*.txt</code> log exported from Ledger Live (
        <code className="font-mono">Ctrl+E</code> / Export Logs).
      </p>
      <Button asChild appearance="accent">
        <label>
          Load Logs
          <input type="file" onChange={onChange} accept=".json,.txt" className="hidden" />
        </label>
      </Button>
    </div>
  );
}

class LogsViewer extends Component {
  state: {
    logs: Log[] | null;
    error: string | null;
  } = {
    logs: null,
    error: null,
  };
  onDragOver: React.DragEventHandler = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "copy";
  };
  onDrop: React.DragEventHandler = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    this.onFiles(evt.dataTransfer.files);
  };
  onFiles = (files: FileList) => {
    const f = files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        this.setState({ logs: parseLogs(String(e.target?.result)), error: null });
      } catch (err) {
        this.setState({
          logs: null,
          error: `Could not parse "${f.name}": ${(err as Error).message}`,
        });
      }
    };
    reader.onerror = () => this.setState({ logs: null, error: `Could not read "${f.name}"` });
    reader.readAsText(f);
  };
  render() {
    const { logs, error } = this.state;
    return (
      <ThemeProvider colorScheme="system">
        <main
          className="bg-canvas flex h-screen flex-col px-24 py-32 body-2 text-base"
          onDragOver={this.onDragOver}
          onDrop={this.onDrop}
        >
          <div className="flex min-h-0 w-full flex-1 flex-col gap-24">
            {error ? (
              <p className="rounded-lg border border-base bg-base p-12 body-2 text-error">
                {error}
              </p>
            ) : null}
            {!logs ? (
              <EmptyState onFiles={this.onFiles} />
            ) : (
              <LogsDashboard
                onFiles={this.onFiles}
                logs={logs}
                logsMeta={logs.find(l => l.message === "exportLogsMeta") as LogMeta | undefined}
              />
            )}
          </div>
        </main>
      </ThemeProvider>
    );
  }
}

export default LogsViewer;
