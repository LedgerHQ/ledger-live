import type { CurrenciesToolProps } from "./types";

export const Currencies = ({ supportedFiats, isFetching, error, refetch }: CurrenciesToolProps) => (
  <div style={{ padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <button type="button" onClick={refetch} disabled={isFetching}>
        {isFetching ? "Refetching…" : "Refetch"}
      </button>
      <span>{supportedFiats.length} supported fiats</span>
    </div>

    {error ? <p role="alert">Error: {error}</p> : null}

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
