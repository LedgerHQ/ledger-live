import { useState, useCallback, useRef } from "react";
import type { EnvDevToolProps, EnvVarEntry } from "../types";

export function Env({ envVars, onOverride, onReset }: EnvDevToolProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? envVars.filter(
        e =>
          e.key.toLowerCase().includes(query.toLowerCase()) ||
          e.desc.toLowerCase().includes(query.toLowerCase()),
      )
    : envVars;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-16 py-8 border-b border-base flex-shrink-0">
        <input
          type="text"
          placeholder="Filter env vars…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-base border border-base rounded px-8 py-4 body-3 text-base"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map(entry => (
          <EnvRow key={entry.key} entry={entry} onOverride={onOverride} onReset={onReset} />
        ))}
      </div>
    </div>
  );
}

function EnvRow({
  entry,
  onOverride,
  onReset,
}: Readonly<{
  entry: EnvVarEntry;
  onOverride: (key: string, rawValue: string) => void;
  onReset: (key: string) => void;
}>) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(
    (value: string) => {
      if (value !== entry.value) onOverride(entry.key, value);
      setDraft(null);
    },
    [entry.key, entry.value, onOverride],
  );

  const displayed = draft ?? entry.value;

  return (
    <div
      className={`px-16 py-10 border-b border-base flex items-center gap-12 ${entry.isOverridden ? "bg-warning-subtle" : ""}`}
    >
      <div className="w-1/2 min-w-0 flex-shrink-0">
        <div className="body-3-semi-bold text-base truncate">{entry.key}</div>
        {entry.desc ? <div className="body-3 text-muted truncate">{entry.desc}</div> : null}
      </div>
      <div className="flex-1 flex items-center gap-8 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={displayed}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") commit(e.currentTarget.value);
            else if (e.key === "Escape") setDraft(null);
          }}
          onBlur={e => commit(e.currentTarget.value)}
          className={`flex-1 min-w-0 bg-base border rounded px-6 py-2 body-3 text-base font-mono ${
            entry.isOverridden ? "border-warning" : "border-base"
          }`}
        />
        {entry.isOverridden ? (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              onReset(entry.key);
              setDraft(null);
            }}
            title={`Reset to: ${entry.defaultValue}`}
            className="body-3 text-muted hover:text-base flex-shrink-0"
          >
            ↺
          </button>
        ) : (
          <span className="w-12 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

export default Env;
