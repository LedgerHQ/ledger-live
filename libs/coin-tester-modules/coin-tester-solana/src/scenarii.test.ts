import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { scenarioSolana } from "./scenarii/solana";
import { killAgave } from "./agave";
import * as legacy from "@ledgerhq/cryptoassets/tokens";
import { setCryptoAssetsStoreGetter } from "@ledgerhq/coin-solana/cryptoAssetsStore";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killSpeculos(), killAgave()]);
  }),
);

//TODO coin tester should not call external endpoints (avoid the error Failed to fetch Figment APY LedgerAPI5xx: Unhandled request)
//TODO mock call to CAL when available
setCryptoAssetsStoreGetter(() => ({
  findTokenByAddress: legacy.findTokenByAddress,
  getTokenById: legacy.getTokenById,
  findTokenById: legacy.findTokenById,
  findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
  findTokenByTicker: legacy.findTokenByTicker,
}));

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
