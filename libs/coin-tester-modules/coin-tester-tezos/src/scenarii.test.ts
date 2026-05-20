import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioTezosTz1, scenarioTezosTz2 } from "./scenarii/tezos";
import { killFlextesa } from "./flextesa";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killFlextesa();
  }),
);

describe("Tezos Deterministic Tester", () => {
  it("scenario Tezos (tz1 / ed25519)", async () => {
    try {
      await executeScenario(scenarioTezosTz1);
    } catch (e) {
      if (e !== "done") {
        await killFlextesa();
        throw e;
      }
    }
  });

  it("scenario Tezos (tz2 / secp256k1)", async () => {
    try {
      await executeScenario(scenarioTezosTz2);
    } catch (e) {
      if (e !== "done") {
        await killFlextesa();
        throw e;
      }
    }
  });
});
