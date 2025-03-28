import { firstValueFrom, reduce } from "rxjs";
import { Account, AccountBridge, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import type { StellarCoinConfig } from "../config";
import { Transaction, StellarAccount } from "../types";
import { createBridges } from "../bridge/index";
import { createFixtureAccount } from "../types/bridge.fixture";

const defaultSyncConfig = {
  paginationConfig: {},
  blacklistedTokenIds: [],
};
function syncAccount<T extends TransactionCommon, A extends Account = Account>(
  bridge: AccountBridge<T, A>,
  account: A,
  syncConfig: SyncConfig = defaultSyncConfig,
): Promise<A> {
  return firstValueFrom(
    bridge.sync(account, syncConfig).pipe(reduce((a, f: (arg0: A) => A) => f(a), account)),
  );
}

const dummyAccount = createFixtureAccount();

describe("Sync Accounts", () => {
  let bridge: ReturnType<typeof createBridges>;
  beforeAll(() => {
    const signer = jest.fn();
    const coinConfig = (): StellarCoinConfig => ({
      status: { type: "active" },
      explorer: {
        url: "https://stellar.coin.ledger.com",
        fetchLimit: 100,
      },
    });
    bridge = createBridges(signer, coinConfig);
  });

  test.each([
    "GAT4LBXYJGJJJRSNK74NPFLO55CDDXSYVMQODSEAAH3M6EY4S7LPH5GV",
    "GCDDN6T2LJN3T7SPWJQV6BCCL5KNY5GBN7X4CMSZLDEXDHXAH32TOAHS",
  ])("should always be sync without error for address %s", async (accountId: string) => {
    const account = await syncAccount<Transaction, StellarAccount>(bridge.accountBridge, {
      ...dummyAccount,
      id: `js:2:stellar:${accountId}:`,
      freshAddress: accountId,
    });

    expect(account.id).toEqual(`js:2:stellar:${accountId}:`);
  });
});
