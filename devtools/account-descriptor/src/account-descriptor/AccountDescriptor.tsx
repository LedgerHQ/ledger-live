import type { AccountDescriptorToolProps } from "../types";

/** Widths sized for the content: short network and type, room for keys and legacy ids. */
const COLUMNS = [
  { label: "Account UUID", width: "18%" },
  { label: "Purpose", width: "6%" },
  { label: "Network", width: "8%" },
  { label: "Type", width: "6%" },
  { label: "Path", width: "12%" },
  { label: "xpub / address", width: "28%" },
  { label: "Legacy id", width: "22%" },
];

const CELL = "px-8 py-6 break-all align-top";

function AccountDescriptor({ accounts }: AccountDescriptorToolProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex-shrink-0 body-3 text-muted">
        {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
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
            {accounts.map(({ accountUUID, legacyId, purpose, type, network, path, key }) => (
              <tr
                key={accountUUID}
                className={`border-b border-base ${purpose === "mock" ? "bg-warning-transparent" : ""}`}
              >
                <td className={CELL}>{accountUUID}</td>
                <td className={`${CELL} ${purpose === "mock" ? "text-warning" : "text-muted"}`}>
                  {purpose}
                </td>
                <td className={CELL}>{network}</td>
                <td className={CELL}>{type}</td>
                <td className={CELL}>{path}</td>
                <td className={CELL}>{key}</td>
                <td className={`${CELL} text-muted`}>{legacyId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccountDescriptor;
