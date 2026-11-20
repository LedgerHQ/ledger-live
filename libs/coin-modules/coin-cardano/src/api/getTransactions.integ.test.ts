import { cardanoDefaults } from "../config";
import { CardanoAccount, PaymentCredential } from "../types";
import { getTransactions } from "./getTransactions";

const xpub =
  "806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d";

const configWithRange = (keychainObservableRange: number) => ({
  ...cardanoDefaults.cardano_testnet,
  keychainObservableRange,
});

const syncWithRange = (keychainObservableRange: number, initialAccount?: CardanoAccount) =>
  getTransactions(configWithRange(keychainObservableRange), xpub, 0, initialAccount, 0);

const indexes = (credentials: Array<PaymentCredential>) => credentials.map(c => c.path.index);
const lastUsedIndex = (credentials: Array<PaymentCredential>) =>
  Math.max(...credentials.filter(c => c.isUsed).map(c => c.path.index));
const indexesUpTo = (lastIndex: number) => Array.from({ length: lastIndex + 1 }, (_, i) => i);
const uniqueHashes = (transactions: Array<{ hash: string }>) =>
  [...new Set(transactions.map(t => t.hash))].sort();

describe("getTransactions (integration)", () => {
  it.each([20, 3, 1])(
    "scans a range of %p fresh addresses past the last used one on each chain",
    async keychainObservableRange => {
      const { transactions, externalCredentials, internalCredentials } =
        await syncWithRange(keychainObservableRange);

      expect(transactions.length).toBeGreaterThan(0);
      for (const credentials of [externalCredentials, internalCredentials]) {
        expect(lastUsedIndex(credentials)).toBeGreaterThanOrEqual(0);
        expect(indexes(credentials)).toEqual(
          indexesUpTo(lastUsedIndex(credentials) + keychainObservableRange),
        );
      }
    },
  );

  it("keeps the stored addresses and transactions when the range shrinks", async () => {
    const firstSync = await syncWithRange(20);
    const initialAccount = {
      cardanoResources: {
        externalCredentials: firstSync.externalCredentials,
        internalCredentials: firstSync.internalCredentials,
      },
    } as unknown as CardanoAccount;

    const shrunkSync = await syncWithRange(1, initialAccount);

    expect(shrunkSync.externalCredentials).toEqual(firstSync.externalCredentials);
    expect(shrunkSync.internalCredentials).toEqual(firstSync.internalCredentials);
    expect(uniqueHashes(shrunkSync.transactions)).toEqual(uniqueHashes(firstSync.transactions));
  });
});
