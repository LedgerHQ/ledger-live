import coinConfig from "@ledgerhq/coin-solana/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { solanaConfig } from "./config";
// Importing the setup wires the live config into coin-solana through createBridges.
import { bridge } from "./setup";

LiveConfig.setConfig(solanaConfig);

describe("solana coin config", () => {
  it("is wired by the family setup", () => {
    expect(bridge.accountBridge).toBeDefined();
  });

  it.each([
    ["solana", "https://solana.coin.ledger.com"],
    ["solana_testnet", "https://api.testnet.solana.com"],
    ["solana_devnet", "https://api.devnet.solana.com"],
  ])("resolves the %s entry's own RPC endpoint", (currencyId, rpc) => {
    expect(coinConfig.getCoinConfig(currencyId).infra.API_SOLANA_PROXY).toBe(rpc);
  });

  it("serves the testnet validator list from the testnet entry", () => {
    expect(coinConfig.getCoinConfig("solana_testnet").infra.SOLANA_VALIDATORS_APP_BASE_URL).toBe(
      "https://validators-solana.coin.ledger.com/api/v1/validators",
    );
  });

  it("falls back to the mainnet entry when no currency is given", () => {
    expect(coinConfig.getCoinConfig().infra.API_SOLANA_PROXY).toBe(
      "https://solana.coin.ledger.com",
    );
  });
});
