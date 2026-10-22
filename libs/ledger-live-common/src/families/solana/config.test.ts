import type { SolanaCoinConfig, SolanaCurrencyId } from "@ledgerhq/coin-solana/config";
import { solanaConfig } from "./config";

// The shipped default is what a release uses until the remote config says otherwise: a currency
// without its own default fails `getCurrencyConfiguration`, and a mainnet endpoint left on a
// staging host reaches every user.
const defaultsOf = (currencyId: SolanaCurrencyId) =>
  solanaConfig[`config_currency_${currencyId}`]?.default as SolanaCoinConfig | undefined;

describe("config_currency_solana* defaults", () => {
  it.each<SolanaCurrencyId>(["solana", "solana_devnet", "solana_testnet"])(
    "registers an RPC endpoint for %s",
    currencyId => {
      const url = defaultsOf(currencyId)?.rpcUrls[currencyId];

      expect(url).toBeDefined();
      expect(new URL(url!).protocol).toBe("https:");
    },
  );

  it.each<SolanaCurrencyId>(["solana", "solana_testnet"])(
    "registers a validators list for %s",
    currencyId => {
      const url = defaultsOf(currencyId)?.validatorsUrl;

      expect(url).toBeDefined();
      expect(new URL(url!).protocol).toBe("https:");
    },
  );

  it("points the mainnet validators list at the production Earn API", () => {
    expect(defaultsOf("solana")!.validatorsUrl).toBe(
      "https://earn.api.live.ledger.com/v0/network/solana/validator-details",
    );
  });

  it("points the mainnet validators summary (APY) at the production Earn API", () => {
    expect(defaultsOf("solana")!.staking?.validatorsSummaryUrl).toBe(
      "https://earn.api.live.ledger.com/figment/solana/validators_summary",
    );
  });

  it("points the mainnet RPC at production", () => {
    const { hostname } = new URL(defaultsOf("solana")!.rpcUrls.solana!);

    expect(hostname).toBe("solana.coin.ledger.com");
  });
});
