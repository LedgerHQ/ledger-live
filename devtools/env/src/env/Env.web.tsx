import {
  DataTable,
  DataTableRoot,
  Divider,
  IconButton,
  SearchInput,
  TextInput,
  useLumenDataTable,
} from "@ledgerhq/lumen-ui-react";
import { RefreshBack } from "@ledgerhq/lumen-ui-react/symbols";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { EnvDevToolProps, EnvVarEntry } from "../types";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    /** The host callbacks an env var row commits and resets itself with. */
    envActions?: Pick<EnvDevToolProps, "onOverride" | "onReset">;
  }
}

function ValueCell({
  entry,
  onOverride,
  onReset,
}: Readonly<{ entry: EnvVarEntry } & Pick<EnvDevToolProps, "onOverride" | "onReset">>) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (value: string) => {
    if (value !== entry.value) onOverride(entry.key, value);
    setDraft(null);
  };

  return (
    <div className="flex w-full items-center gap-8 min-w-0">
      <TextInput
        aria-label={entry.key}
        value={draft ?? entry.value}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") commit(e.currentTarget.value);
          else if (e.key === "Escape") setDraft(null);
        }}
        onBlur={e => commit(e.currentTarget.value)}
        className="min-w-0 flex-1 [&_input]:font-mono"
        hideClearButton
      />
      {entry.isOverridden ? (
        <IconButton
          appearance="gray"
          size="xs"
          icon={RefreshBack}
          aria-label={`Reset to: ${entry.defaultValue}`}
          title={`Reset to: ${entry.defaultValue}`}
          onMouseDown={e => e.preventDefault()}
          onClick={() => {
            onReset(entry.key);
            setDraft(null);
          }}
        />
      ) : null}
    </div>
  );
}

const COLUMNS: ColumnDef<EnvVarEntry>[] = [
  {
    accessorKey: "key",
    header: "Variable",
    meta: { className: "w-320" },
    cell: ({ row: { original: entry } }) => (
      <div className="flex flex-col min-w-0">
        <span className="body-3-semi-bold text-base truncate">{entry.key}</span>
        {entry.desc ? <span className="body-3 text-muted truncate">{entry.desc}</span> : null}
      </div>
    ),
  },
  {
    accessorKey: "value",
    header: "Value",
    meta: { className: "w-full" },
    cell: ({ row, table }) => {
      const actions = table.options.meta?.envActions;
      return actions ? <ValueCell entry={row.original} {...actions} /> : null;
    },
  },
];

function matches({ key, desc }: EnvVarEntry, query: string): boolean {
  const needle = query.toLowerCase();
  return key.toLowerCase().includes(needle) || desc.toLowerCase().includes(needle);
}

function Env({ envVars, onOverride, onReset }: EnvDevToolProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => (query.trim() ? envVars.filter(entry => matches(entry, query)) : [...envVars]),
    [envVars, query],
  );
  const table = useLumenDataTable({
    data: filtered,
    columns: COLUMNS,
    getRowId: entry => entry.key,
    meta: { envActions: { onOverride, onReset } },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-16 py-8 flex-shrink-0">
        <SearchInput
          placeholder="Filter env vars…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <Divider />
      <DataTableRoot
        table={table}
        className="flex-1 min-h-0"
        getRowProps={({ original }) =>
          original.isOverridden ? { className: "bg-warning-transparent" } : undefined
        }
      >
        <DataTable className="h-full" />
      </DataTableRoot>
    </div>
  );
}

export default Env;
