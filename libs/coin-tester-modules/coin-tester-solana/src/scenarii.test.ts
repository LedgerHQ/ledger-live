import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { scenarioSolana } from "./scenarii/solana";
import { killAgave } from "./agave";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { setCryptoAssetsStoreGetter } from "@ledgerhq/coin-solana/cryptoAssetsStore";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killSpeculos(), killAgave()]);
  }),
);

initializeLegacyTokens(addTokens);
setCryptoAssetsStoreGetter(() => legacyCryptoAssetsStore);

describe("Solana Deterministic Tester", () => {
  it("scenario Solana", async () => {
    try {
      await executeScenario(scenarioSolana);
    } catch (e) {
      if (e !== "done") {
        await Promise.all([killSpeculos(), killAgave()]);
        throw e;
      }
    }
  });
});
