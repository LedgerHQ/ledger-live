import BitcoinLikeExplorer from "@ledgerhq/wallet-btc/explorer/index";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account } from "@ledgerhq/types-live";
import { bindExplorer, resolveAccountConfig } from "./explorer";
import { contextWith } from "./__tests__/fixtures/coinConfig";
import { DEFAULT_EXPLORER_BATCH_SIZE } from "./constants";

const bitcoin = getCryptoCurrencyById("bitcoin");
const walletAccountWith = (explorer: unknown) =>
  ({ xpub: { explorer } }) as unknown as WalletAccount;
const config = (url: string, explorerId = "btc", batchSize?: number) => ({
  explorer: { url, ...(batchSize === undefined ? {} : { batchSize }) },
  explorerId,
});
const boundExplorer = (account: WalletAccount) => account.xpub.explorer as BitcoinLikeExplorer;

describe("bindExplorer", () => {
  it("points an unbound (deserialized) account at the configured explorer", () => {
    const account = walletAccountWith(
      new BitcoinLikeExplorer({
        cryptoCurrency: { id: "bitcoin", explorerId: "btc", explorerEndpoint: "" },
      }),
    );

    bindExplorer(account, bitcoin, config("https://explorer.example"));

    expect(boundExplorer(account).baseUrl).toBe("https://explorer.example/blockchain/v4/btc");
    expect(boundExplorer(account).batchSize).toBe(DEFAULT_EXPLORER_BATCH_SIZE);
  });

  it("follows a changed explorer url, explorer id or batch size on the next call", () => {
    const account = walletAccountWith(undefined);
    bindExplorer(account, bitcoin, config("https://first.example"));

    bindExplorer(account, bitcoin, config("https://second.example", "btc2", 250));

    expect(boundExplorer(account).baseUrl).toBe("https://second.example/blockchain/v4/btc2");
    expect(boundExplorer(account).batchSize).toBe(250);
  });

  it("keeps the bound explorer when the config is unchanged", () => {
    const account = walletAccountWith(undefined);
    bindExplorer(account, bitcoin, config("https://explorer.example"));
    const bound = account.xpub.explorer;

    bindExplorer(account, bitcoin, config("https://explorer.example"));

    expect(account.xpub.explorer).toBe(bound);
  });
});

describe("resolveAccountConfig", () => {
  it("returns the config of the account currency and binds its explorer", async () => {
    const walletAccount = walletAccountWith(undefined);
    const account = {
      currency: bitcoin,
      bitcoinResources: { utxos: [], walletAccount },
    } as unknown as Account;
    const context = contextWith(config("https://explorer.example"));
    const configSpy = jest.spyOn(context, "config");

    const resolved = await resolveAccountConfig(context, account);

    expect(configSpy).toHaveBeenCalledWith("bitcoin");
    expect(resolved.explorer.url).toBe("https://explorer.example");
    expect(boundExplorer(walletAccount).baseUrl).toBe("https://explorer.example/blockchain/v4/btc");
  });

  it("resolves the config of an account that has no wallet-btc account yet", async () => {
    const account = { currency: bitcoin } as unknown as Account;

    await expect(
      resolveAccountConfig(contextWith(config("https://explorer.example")), account),
    ).resolves.toMatchObject({ explorer: { url: "https://explorer.example" } });
  });
});
