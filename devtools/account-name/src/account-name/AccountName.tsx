import { useState } from "react";
import type { AccountNameToolProps } from "../types";

const COLUMNS = [
  { label: "Name", width: "20%" },
  { label: "Account UUID", width: "35%" },
  { label: "Legacy id", width: "45%" },
];

const CELL = "px-8 py-6 break-all align-top";

function AccountName({ names, nameOf }: AccountNameToolProps) {
  const [accountUUID, setAccountUUID] = useState("");
  const query = accountUUID.trim();
  const found = query ? nameOf(query) : undefined;
  const custom = names.filter(row => !row.isDefault).length;

  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex-shrink-0 flex flex-col gap-4">
        <input
          type="text"
          aria-label="Account UUID"
          placeholder="Look up a name by account UUID…"
          value={accountUUID}
          onChange={e => setAccountUUID(e.target.value)}
          className="w-full bg-base border border-base rounded px-8 py-4 body-3 font-mono text-base"
        />
        {query ? (
          <div className="body-3 font-mono text-base">
            {found ?? "No custom name for this account"}
          </div>
        ) : null}
      </div>
      <div className="px-16 py-8 border-b border-base flex-shrink-0 body-3 text-muted">
        {custom} custom, {names.length - custom} default
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed body-3 font-mono text-left">
          <colgroup>
            {COLUMNS.map(({ label, width }) => (
              <col key={label} style={{ width }} />
            ))}
          </colgroup>
          <thead className="text-muted">
            <tr>
              {COLUMNS.map(({ label }) => (
                <th key={label} className={`${CELL} border-b border-base`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-base">
            {names.map(({ legacyId, accountUUID: uuid, name, isDefault }) => (
              <tr
                key={legacyId}
                className={`border-b border-base ${isDefault ? "text-muted" : ""}`}
              >
                <td className={CELL}>{name}</td>
                <td className={CELL}>{uuid ?? "—"}</td>
                <td className={`${CELL} text-muted`}>{legacyId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountName;
