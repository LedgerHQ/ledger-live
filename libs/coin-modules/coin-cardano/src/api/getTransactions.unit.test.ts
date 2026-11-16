import { getTransactions } from "./getTransactions";
import { getAllTransactionsByKeys } from "./fetchTransactions";
import { getBipPath, getCredentialKey, getExtendedPublicKeyFromHex } from "../logic";
import { CardanoAccount, PaymentChain } from "../types";
import { cardanoCoinConfig as config } from "../fixtures/config";
import * as ApiTypes from "./api-types";

jest.mock("./fetchTransactions");

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

const xpub =
  "2b7203eaac6970424a3c03c6523d73d5c5c8608bbdb2da6cac0fa818a550070226ff4d533833edaf32c8153559089195376128ae9f533a5e89fc4c256a50f6df";

describe("getTransactions — sync must not mutate frozen initialAccount credentials", () => {
  it("does not mutate frozen credentials sourced from initialAccount", async () => {
    const usedKey = "bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07"; // gitleaks:allow
    const initialAccount = deepFreeze({
      cardanoResources: {
        externalCredentials: [
          {
            isUsed: false,
            key: usedKey,
            path: { account: 0, chain: 0, coin: 1815, index: 0, purpose: 1852 },
          },
        ],
        internalCredentials: [],
      },
    } as unknown as CardanoAccount);

    jest.mocked(getAllTransactionsByKeys).mockResolvedValue({
      transactions: [
        {
          fees: "0",
          hash: "tx1",
          timestamp: "2024-01-01T00:00:00.000Z",
          blockHeight: 1,
          inputs: [],
          outputs: [{ address: "addr", value: "5", paymentKey: usedKey, tokens: [] }],
          certificate: {
            stakeRegistrations: [],
            stakeDeRegistrations: [],
            stakeDelegations: [],
          },
        },
      ],
      blockHeight: 1,
    } as any);

    const result = await getTransactions(config, xpub, 0, initialAccount, 0);

    expect(result.externalCredentials.find(c => c.key === usedKey)?.isUsed).toBe(true);
    expect(initialAccount.cardanoResources.externalCredentials[0].isUsed).toBe(false);
  });
});

const requestedKeys = () =>
  jest.mocked(getAllTransactionsByKeys).mock.calls.map(([, keys]) => keys);
const transactionUsing = (paymentKey: string): ApiTypes.APITransaction => ({
  fees: "0",
  hash: `tx-${paymentKey}`,
  timestamp: "2024-01-01T00:00:00.000Z",
  blockHeight: 1,
  inputs: [],
  outputs: [{ address: "addr", value: "5", paymentKey, tokens: [] }],
  certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations: [] },
});

describe("getTransactions — keychain observable range", () => {
  const rangedConfig = { ...config, keychainObservableRange: 3 };
  const accountPubKey = getExtendedPublicKeyFromHex(xpub);
  const externalKeyAt = (index: number) =>
    getCredentialKey(accountPubKey, getBipPath({ account: 0, chain: PaymentChain.external, index }))
      .key;
  const externalKeys = new Set([0, 1, 2, 3, 4].map(externalKeyAt));
  const externalRequests = () =>
    requestedKeys().filter(keys => keys.some(k => externalKeys.has(k)));

  beforeEach(() => {
    jest.mocked(getAllTransactionsByKeys).mockReset();
  });

  it("scans as many fresh keys per chain as the configured range", async () => {
    jest.mocked(getAllTransactionsByKeys).mockResolvedValue({ transactions: [], blockHeight: 1 });

    const result = await getTransactions(rangedConfig, xpub, 0, undefined, 0);

    expect(requestedKeys().map(keys => keys.length)).toEqual([3, 3]);
    expect(result.externalCredentials.map(c => c.path.index)).toEqual([0, 1, 2]);
    expect(result.internalCredentials.map(c => c.path.index)).toEqual([0, 1, 2]);
  });

  it.each([undefined as unknown as number, 0, -1, 2.5, NaN])(
    "falls back to the default range when the configured range is %p",
    async keychainObservableRange => {
      jest.mocked(getAllTransactionsByKeys).mockResolvedValue({ transactions: [], blockHeight: 1 });
      const defaultIndexes = Array.from({ length: 20 }, (_, index) => index);

      const result = await getTransactions(
        { ...config, keychainObservableRange },
        xpub,
        0,
        undefined,
        0,
      );

      expect(requestedKeys().map(keys => keys.length)).toEqual([20, 20]);
      expect(result.externalCredentials.map(c => c.path.index)).toEqual(defaultIndexes);
      expect(result.internalCredentials.map(c => c.path.index)).toEqual(defaultIndexes);
    },
  );

  it("fetches known credentials in chunks of the configured range", async () => {
    jest.mocked(getAllTransactionsByKeys).mockResolvedValue({ transactions: [], blockHeight: 1 });
    const externalCredentials = [0, 1, 2, 3, 4, 5, 6].map(index => ({
      isUsed: index === 6,
      key: `known-key-${index}`,
      path: { account: 0, chain: PaymentChain.external, coin: 1815, index, purpose: 1852 },
    }));
    const initialAccount = {
      cardanoResources: { externalCredentials, internalCredentials: [] },
    } as unknown as CardanoAccount;

    const result = await getTransactions(rangedConfig, xpub, 0, initialAccount, 0);

    const knownKeyChunks = requestedKeys().filter(keys => keys[0]?.startsWith("known-key-"));
    expect(knownKeyChunks.map(keys => keys.length)).toEqual([3, 3, 1]);
    expect(result.externalCredentials.map(c => c.path.index)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it("extends the scan by the configured range after the last used key", async () => {
    const usedKey = externalKeyAt(1);
    jest.mocked(getAllTransactionsByKeys).mockImplementation(async (_config, keys) => ({
      transactions: keys.includes(usedKey) ? [transactionUsing(usedKey)] : [],
      blockHeight: 1,
    }));

    const result = await getTransactions(rangedConfig, xpub, 0, undefined, 0);

    expect(externalRequests()).toEqual([
      [externalKeyAt(0), externalKeyAt(1), externalKeyAt(2)],
      [externalKeyAt(3), externalKeyAt(4)],
    ]);
    expect(result.externalCredentials.map(c => [c.path.index, c.isUsed])).toEqual([
      [0, false],
      [1, true],
      [2, false],
      [3, false],
      [4, false],
    ]);
  });

  it("requests no fresh keys when the stored credentials extend past the configured range", async () => {
    jest.mocked(getAllTransactionsByKeys).mockResolvedValue({ transactions: [], blockHeight: 1 });
    const externalCredentials = [0, 1, 2, 3, 4, 5, 6].map(index => ({
      isUsed: index === 1,
      key: `known-key-${index}`,
      path: { account: 0, chain: PaymentChain.external, coin: 1815, index, purpose: 1852 },
    }));
    const initialAccount = {
      cardanoResources: { externalCredentials, internalCredentials: [] },
    } as unknown as CardanoAccount;

    const result = await getTransactions(rangedConfig, xpub, 0, initialAccount, 0);

    expect(requestedKeys()).not.toContainEqual([]);
    expect(requestedKeys().filter(keys => keys[0]?.startsWith("known-key-"))).toEqual([
      ["known-key-0", "known-key-1", "known-key-2"],
      ["known-key-3", "known-key-4", "known-key-5"],
      ["known-key-6"],
    ]);
    expect(result.externalCredentials.map(c => [c.path.index, c.isUsed])).toEqual([
      [0, false],
      [1, true],
      [2, false],
      [3, false],
      [4, false],
      [5, false],
      [6, false],
    ]);
  });

  it.each([
    { keychainObservableRange: 3, expectedRequests: [[0, 1, 2], [3]] },
    { keychainObservableRange: 1, expectedRequests: [[0], [1]] },
  ])(
    "extends the scan past a used first key with a range of $keychainObservableRange",
    async ({ keychainObservableRange, expectedRequests }) => {
      const usedKey = externalKeyAt(0);
      jest.mocked(getAllTransactionsByKeys).mockImplementation(async (_config, keys) => ({
        transactions: keys.includes(usedKey) ? [transactionUsing(usedKey)] : [],
        blockHeight: 1,
      }));

      const result = await getTransactions(
        { ...config, keychainObservableRange },
        xpub,
        0,
        undefined,
        0,
      );

      expect(externalRequests()).toEqual(
        expectedRequests.map(indexes => indexes.map(externalKeyAt)),
      );
      expect(result.externalCredentials.map(c => [c.path.index, c.isUsed])).toEqual(
        expectedRequests.flat().map(index => [index, index === 0]),
      );
    },
  );
});
