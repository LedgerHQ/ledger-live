import { safeExecuteScenario } from "./helpers";
import { scenarioCardano } from "./scenarii/cardano";
import { scenarioCardanoToken } from "./scenarii/cardanoToken";
import { scenarioCardanoYaci } from "./scenarii/cardanoYaci";
import { scenarioCardanoTokenYaci } from "./scenarii/cardanoTokenYaci";
import { killYaci } from "./yaci";

jest.setTimeout(600_000);

describe("Cardano Deterministic Tester", () => {
  // Mock backend (MSW): staking lives here until real-node multi-witness signing lands.
  it("scenario Cardano", () => safeExecuteScenario(scenarioCardano));
  it("scenario Cardano native token", () => safeExecuteScenario(scenarioCardanoToken));

  // Yaci devnet backend: each scenario boots/tears down the devnet via yaci.ts (kill it on failure).
  it("scenario Cardano native sends (Yaci)", () =>
    safeExecuteScenario(scenarioCardanoYaci, killYaci));
  it("scenario Cardano native token send (Yaci)", () =>
    safeExecuteScenario(scenarioCardanoTokenYaci, killYaci));
});
