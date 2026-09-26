import BitcoinLikeExplorer from "@ledgerhq/wallet-btc/explorer/index";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { bindExplorer } from "./explorer";

const zcash = getCryptoCurrencyById("zcash");
const walletAccountWith = (explorer: unknown) =>
  ({ xpub: { explorer } }) as unknown as WalletAccount;

describe("bindExplorer", () => {
  it("points an unbound (deserialized) account at the configured explorer", () => {
    const account = walletAccountWith(
      new BitcoinLikeExplorer({
        cryptoCurrency: { id: "zcash", explorerId: "zec", explorerEndpoint: "" },
      }),
    );

    bindExplorer(account, zcash, "https://explorer.example");

    expect((account.xpub.explorer as BitcoinLikeExplorer).baseUrl).toBe(
      "https://explorer.example/blockchain/v4/zec",
    );
  });

  it("follows a changed explorer url on the next call", () => {
    const account = walletAccountWith(undefined);
    bindExplorer(account, zcash, "https://first.example");

    bindExplorer(account, zcash, "https://second.example");

    expect((account.xpub.explorer as BitcoinLikeExplorer).baseUrl).toBe(
      "https://second.example/blockchain/v4/zec",
    );
  });

  it("keeps the bound explorer when the url is unchanged", () => {
    const account = walletAccountWith(undefined);
    bindExplorer(account, zcash, "https://explorer.example");
    const bound = account.xpub.explorer;

    bindExplorer(account, zcash, "https://explorer.example");

    expect(account.xpub.explorer).toBe(bound);
  });
});
