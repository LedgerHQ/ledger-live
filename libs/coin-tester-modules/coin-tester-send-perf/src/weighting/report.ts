import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { SendPerfFixture } from "../engine/fixtureTypes";
import { ETH_LAYER1_SCENARIOS } from "../scenarios/eth/scenarios";
import { SOL_LAYER1_SCENARIOS } from "../scenarios/sol/scenarios";
import { BTC_LAYER1_STUBS } from "../scenarios/btc/stubs";
import { PRODUCTION_ERROR_CATALOG, ProductionErrorEntry } from "./errorsCatalog";

export type WeightingReport = {
  scenariosWithZeroWeight: string[];
  productionErrorsWithoutScenario: ProductionErrorEntry[];
  covered: { scenarioId: string; errorPattern: string; count_14d?: number }[];
};

function loadJsonFixtures(dir: string): SendPerfFixture[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .flatMap(file => {
      const raw = readFileSync(join(dir, file), "utf8");
      const parsed = JSON.parse(raw) as SendPerfFixture | SendPerfFixture[];
      return Array.isArray(parsed) ? parsed : [parsed];
    });
}

export function collectRegisteredFixtures(): SendPerfFixture[] {
  const fixturesDir = join(__dirname, "../../fixtures");
  const fromJson = [
    ...loadJsonFixtures(join(fixturesDir, "eth")),
    ...loadJsonFixtures(join(fixturesDir, "sol")),
    ...loadJsonFixtures(join(fixturesDir, "btc")),
  ];

  const fromCode = [
    ...ETH_LAYER1_SCENARIOS.map(s => s.fixture),
    ...SOL_LAYER1_SCENARIOS.map(s => s.fixture),
    ...BTC_LAYER1_STUBS,
  ];

  const byId = new Map<string, SendPerfFixture>();
  for (const f of [...fromJson, ...fromCode]) {
    byId.set(f.id, f);
  }
  return [...byId.values()];
}

export function buildWeightingReport(catalog = PRODUCTION_ERROR_CATALOG): WeightingReport {
  const fixtures = collectRegisteredFixtures();

  const scenariosWithZeroWeight = fixtures
    .filter(f => !f.productionWeight?.count_14d && !f.productionWeight?.note)
    .map(f => f.id);

  const covered = fixtures
    .filter(f => f.productionWeight)
    .map(f => ({
      scenarioId: f.id,
      errorPattern: f.expectReject,
      count_14d: f.productionWeight?.count_14d,
    }));

  const productionErrorsWithoutScenario = catalog.filter(entry => {
    return !fixtures.some(
      f =>
        f.chain === entry.chain &&
        f.expectReject.toLowerCase().includes(entry.errorPattern.toLowerCase()),
    );
  });

  return { scenariosWithZeroWeight, productionErrorsWithoutScenario, covered };
}

export function formatWeightingReport(report: WeightingReport): string {
  const lines: string[] = [
    "# Send Performance Harness — Layer 3 Weighting Report",
    "",
    "## Covered scenarios",
    ...report.covered.map(
      c =>
        `- ${c.scenarioId}: "${c.errorPattern}"${c.count_14d != null ? ` (${c.count_14d}/14d)` : ""}`,
    ),
    "",
    "## Scenarios without production weight metadata",
    ...(report.scenariosWithZeroWeight.length
      ? report.scenariosWithZeroWeight.map(id => `- ${id}`)
      : ["- (none)"]),
    "",
    "## Production errors without a matching scenario",
    ...(report.productionErrorsWithoutScenario.length
      ? report.productionErrorsWithoutScenario.map(
          e =>
            `- [${e.chain}] "${e.errorPattern}" (${e.source}${e.count_14d != null ? `, ${e.count_14d}/14d` : ""})`,
        )
      : ["- (none)"]),
    "",
  ];

  return lines.join("\n");
}

if (require.main === module) {
  const report = buildWeightingReport();
  console.log(formatWeightingReport(report));
  if (report.productionErrorsWithoutScenario.length > 0) {
    process.exitCode = 0;
  }
}
