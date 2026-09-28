import BitcoinLikeExplorer from "@ledgerhq/wallet-btc/explorer/index";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import wallet, { DerivationModes } from "@ledgerhq/wallet-btc/index";
import { toWalletBtcCurrency } from "../walletBtcCurrency";
import { bindExplorer } from "./explorer";

const zcash = getCryptoCurrencyById("zcash");
const walletAccountWith = (explorer: unknown) =>
  ({ xpub: { explorer } }) as unknown as WalletAccount;
const config = (url: string, explorerId = "zec") => ({ explorer: { url }, explorerId });

describe("bindExplorer", () => {
  it("points an unbound (deserialized) account at the configured explorer", () => {
    const account = walletAccountWith(
      new BitcoinLikeExplorer({
        cryptoCurrency: { id: "zcash", explorerId: "zec", explorerEndpoint: "" },
      }),
    );

    bindExplorer(account, zcash, config("https://explorer.example"));

    expect((account.xpub.explorer as BitcoinLikeExplorer).baseUrl).toBe(
      "https://explorer.example/blockchain/v4/zec",
    );
  });

  it("follows a changed explorer url on the next call", () => {
    const account = walletAccountWith(undefined);
    bindExplorer(account, zcash, config("https://first.example"));

    bindExplorer(account, zcash, config("https://second.example"));

    expect((account.xpub.explorer as BitcoinLikeExplorer).baseUrl).toBe(
      "https://second.example/blockchain/v4/zec",
    );
  });

  it("follows a changed explorer id on the next call", () => {
    const account = walletAccountWith(undefined);
    bindExplorer(account, zcash, config("https://explorer.example", "zec"));

    bindExplorer(account, zcash, config("https://explorer.example", "zec2"));

    expect((account.xpub.explorer as BitcoinLikeExplorer).baseUrl).toBe(
      "https://explorer.example/blockchain/v4/zec2",
    );
  });

  it("falls back to the currency id when the coin config has no explorer id", () => {
    const account = walletAccountWith(undefined);

    bindExplorer(account, zcash, { explorer: { url: "https://explorer.example" } });

    expect((account.xpub.explorer as BitcoinLikeExplorer).baseUrl).toBe(
      "https://explorer.example/blockchain/v4/zcash",
    );
  });

  it("rebinds a freshly generated account that wallet-btc handed a cached, unbound explorer", async () => {
    // Deserialization seeds wallet-btc's per-currency explorer cache unbound (first set wins)...
    wallet.getExplorer(toWalletBtcCurrency(zcash, { explorer: { url: "" } }));
    // ...so an account generated afterwards gets that explorer, whatever endpoint it asks for.
    const generated = await wallet.generateAccount(
      {
        // BIP-32 test vector 1 master xpub: never derived from here, only held.
        xpub: "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8",
        path: "44'/133'",
        index: 0,
        currency: "zcash",
        network: "mainnet",
        derivationMode: DerivationModes.LEGACY,
      },
      toWalletBtcCurrency(zcash, config("https://explorer.example")),
    );
    expect((generated.xpub.explorer as BitcoinLikeExplorer).baseUrl).not.toContain(
      "explorer.example",
    );

    bindExplorer(generated, zcash, config("https://explorer.example"));

    expect((generated.xpub.explorer as BitcoinLikeExplorer).baseUrl).toBe(
      "https://explorer.example/blockchain/v4/zec",
    );
  });

  it("keeps the bound explorer when the url is unchanged", () => {
    const account = walletAccountWith(undefined);
    bindExplorer(account, zcash, config("https://explorer.example"));
    const bound = account.xpub.explorer;

    bindExplorer(account, zcash, config("https://explorer.example"));

    expect(account.xpub.explorer).toBe(bound);
  });
});
