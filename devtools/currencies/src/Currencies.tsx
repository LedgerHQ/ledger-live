import type { CurrenciesToolProps } from "./types";

export const Currencies = ({ supportedFiats, status, refetch }: CurrenciesToolProps) => (
  <div style={{ padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <button type="button" onClick={refetch} disabled={status.type === "fetching"}>
        {status.type === "fetching" ? "Refetching…" : "Refetch"}
      </button>
      <span>{supportedFiats.length} supported fiats</span>
    </div>

    {status.type === "error" ? <p role="alert">Error: {status.message}</p> : null}

    <ul>
      {supportedFiats.map(fiat => (
        <li key={fiat.id}>
          <strong>{fiat.ticker}</strong> — {fiat.name}
          {fiat.symbol ? ` (${fiat.symbol})` : ""}
        </li>
      ))}
    </ul>
  </div>
);

export default Currencies;
