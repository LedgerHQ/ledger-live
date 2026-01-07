import { filterServiceStatusIncidents } from "./index";
import { LEDGER_COMPONENTS } from "./ledger-components";
import type { Incident } from "./types";

const makeIncident = (overrides: Partial<Incident> = {}): Incident => ({
  created_at: "2025-01-01T00:00:00Z",
  id: Math.random().toString(16).slice(2),
  impact: "minor",
  incident_updates: [],
  monitoring_at: null,
  name: "Test incident",
  page_id: null,
  resolved_at: null,
  shortlink: null,
  status: "investigating",
  updated_at: null,
  ...overrides,
});

describe("filterServiceStatusIncidents", () => {
  it("returns empty when no tickers or no incidents", () => {
    expect(filterServiceStatusIncidents([], ["BTC"]).length).toBe(0);
    expect(filterServiceStatusIncidents([makeIncident()], []).length).toBe(0);
  });

  it("matches incidents with known Ledger components (case-insensitive)", () => {
    const incidents: Incident[] = [
      makeIncident({ components: [{ id: "1", name: "Ledger Application Store" }] }),
      makeIncident({ components: [{ id: "2", name: "ledger appliCAtion store" }] }),
      makeIncident({ components: [{ id: "3", name: "Unknown Component" }] }),
    ];

    const result = filterServiceStatusIncidents(incidents, ["BTC"], "notifications");
    expect(result.map(i => i.components?.[0].id)).toEqual(["1", "2"]);
  });

  it("matches incidents if a component contains a tracked ticker as a whole word (case-insensitive)", () => {
    const incidents: Incident[] = [
      makeIncident({ components: [{ id: "1", name: "BTC Node" }] }),
      makeIncident({ components: [{ id: "2", name: "eth Node" }] }),
      makeIncident({ components: [{ id: "3", name: "TETHER Service" }] }),
      makeIncident({ components: [{ id: "4", name: "NOTBTCService" }] }),
    ];

    const result = filterServiceStatusIncidents(incidents, ["BTC", "ETH"]);
    expect(result.map(i => i.components?.[0].id)).toEqual(["1", "2"]);
  });

  it("includes incidents with no components array or empty array", () => {
    const incidents: Incident[] = [
      makeIncident({ components: undefined }),
      makeIncident({ components: [] }),
    ];

    const result = filterServiceStatusIncidents(incidents, ["BTC"]);
    expect(result.length).toBe(2);
  });

  it("escapes tickers so special regex characters do not break matching", () => {
    const incidents: Incident[] = [
      makeIncident({ components: [{ id: "1", name: "USDT Node" }] }),
      makeIncident({ components: [{ id: "2", name: "US.DT Node" }] }),
      makeIncident({ components: [{ id: "3", name: "(USDT) Node" }] }),
      makeIncident({ components: [{ id: "4", name: "Ethereum  Node" }] }),
      makeIncident({ components: [{ id: "5", name: "Ethereum (ETH) swap issue" }] }),
    ];

    const result = filterServiceStatusIncidents(incidents, ["USDT", "ETH"]);
    expect(result.map(i => i.components?.[0].id)).toEqual(["1", "3", "5"]);
    expect(result.length).toBe(3);
  });

  it("matches incidents for all known Ledger components", () => {
    const incidents: Incident[] = LEDGER_COMPONENTS.map((name, index) =>
      makeIncident({ components: [{ id: `${index + 1}`, name }] }),
    );

    const result = filterServiceStatusIncidents(incidents, ["BTC"], "notifications");
    expect(result.length).toBe(LEDGER_COMPONENTS.length);
  });

  it("filters correctly with common tickers", () => {
    const tickers = ["XRP", "SOL", "ETH", "BTC", "ADA", "USDC", "USDT"];
    const incidents: Incident[] = [
      makeIncident({ components: [{ id: "1", name: "BTC Node" }] }),
      makeIncident({ components: [{ id: "2", name: "eth Node" }] }),
      makeIncident({ components: [{ id: "3", name: "ADA-Service" }] }),
      makeIncident({ components: [{ id: "4", name: "usdc gateway" }] }),
      makeIncident({ components: [{ id: "5", name: "NOTUSDTService" }] }),
      makeIncident({ components: [{ id: "6", name: "USDT" }] }),
      makeIncident({ components: [{ id: "7", name: "xrp relayer" }] }),
      makeIncident({ components: [{ id: "8", name: "SOL Node" }] }),
      makeIncident({ components: [{ id: "9", name: "SOLANA Node" }] }),
      makeIncident({ components: [{ id: "10", name: "Random Service" }] }),
      makeIncident({ components: [] }),
    ];

    const result = filterServiceStatusIncidents(incidents, tickers);
    expect(result.map(i => i.components?.[0]?.id)).toEqual(["1", "2", "3", "4", "6", "7", "8"]);
    expect(result.length).toBe(8);
  });
});
