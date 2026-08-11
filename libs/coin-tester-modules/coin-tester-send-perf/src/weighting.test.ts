import { buildWeightingReport, formatWeightingReport } from "./weighting/report";

describe("Send Performance Harness — Layer 3 weighting", () => {
  it("maps scenarios to production error catalog", () => {
    const report = buildWeightingReport();
    expect(report.covered.length).toBeGreaterThanOrEqual(5);
    expect(formatWeightingReport(report)).toContain("eth-insufficient-funds");
  });

  it("documents BTC Layer 1 scenarios from regtest harness", () => {
    const report = buildWeightingReport();
    const btcCovered = report.covered.filter(c => c.scenarioId.startsWith("btc-"));
    expect(btcCovered.length).toBeGreaterThanOrEqual(2);
  });
});
