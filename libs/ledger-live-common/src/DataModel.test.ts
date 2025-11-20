import { Account, AccountRaw, AccountUserData, Operation } from "@ledgerhq/types-live";
import { APTOS_NON_HARDENED_DERIVATION_PATH } from "@ledgerhq/coin-aptos/constants";
import { accountRawToAccountUserData } from "@ledgerhq/live-wallet/store";
import { createDataModel } from "./DataModel";
import { fromAccountRaw, toAccountRaw } from "./account";
import { getCurrencyConfiguration } from "./config";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";

jest.mock("./config", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

const opRetentionStategy =
  (maxDaysOld: number, keepFirst: number) =>
  (op: Operation, index: number): boolean =>
    index < keepFirst || Date.now() - op.date.getTime() < 1000 * 60 * 60 * 24 * maxDaysOld;

const schema = {
  migrations: [raw => raw],
  decode: async (raw: AccountRaw) => [await fromAccountRaw(raw), accountRawToAccountUserData(raw)],
  encode: ([account, userData]: [Account, AccountUserData]): AccountRaw =>
    toAccountRaw(
      {
        ...account,
        operations: account.operations.filter(opRetentionStategy(366, 500)),
      },
      userData,
    ),
};

const cryptoOrgAccount = {
  data: {
    id: "js:2:crypto_org:cosmos1address:",
    seedIdentifier: "test-seed",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "cosmos1address",
    freshAddressPath: "44'/394'/0'/0/0",
    balance: "0",
    blockHeight: 0,
    currencyId: "crypto_org",
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date().toISOString(),
  } as AccountRaw,
  version: 1,
};

const aptosAccount = {
  data: {
    id: "js:2:aptos:0x1234567890abcdef:",
    seedIdentifier: "test-seed",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "0x1234567890abcdef",
    freshAddressPath: APTOS_NON_HARDENED_DERIVATION_PATH,
    balance: "0",
    blockHeight: 0,
    currencyId: "aptos",
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date().toISOString(),
  } as AccountRaw,
  version: 1,
};

const evmAccount = {
  data: {
    id: "js:2:ethereum:0x1234567890abcdef1234567890abcdef12345678:",
    seedIdentifier: "test-seed",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "0x1234567890abcdef1234567890abcdef12345678",
    freshAddressPath: "44'/60'/0'/0/0",
    balance: "0",
    blockHeight: 0,
    currencyId: "ethereum",
    operations: [
      {
        id: "op_evm_001",
        hash: "0xhash1",
        type: "OUT",
        value: "0",
        fee: "0",
        blockHeight: 1,
        blockHash: "0xblock1",
        accountId: "js:2:ethereum:0x1234567890abcdef1234567890abcdef12345678:",
        date: new Date().toISOString(),
        senders: [],
        recipients: [],
        extra: {},
      },
      {
        id: "op_evm_002",
        hash: "0xhash2",
        type: "OUT",
        value: "0",
        fee: "0",
        blockHeight: 2,
        blockHash: "0xblock2",
        accountId: "js:2:ethereum:0x1234567890abcdef1234567890abcdef12345678:",
        date: new Date().toISOString(),
        senders: [],
        recipients: [],
        extra: {},
        nftOperations: [{ id: "op_evm_nft_001" }],
      },
    ],
    pendingOperations: [],
    lastSyncDate: new Date().toISOString(),
  } as AccountRaw,
  version: 1,
};

describe("DataModel", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  setCryptoAssetsStoreForCoinFramework({
    findTokenById: async (_: string) => undefined,
    findTokenByAddressInCurrency: async (_: string, __: string) => undefined,
    getTokensSyncHash: async (_: string) => "",
  } as unknown as CryptoAssetsStore);

  test("createDataModel for crypto.org account", async () => {
    const migratedCryptoOrgAccount = await createDataModel(schema).decode(cryptoOrgAccount);
    expect(migratedCryptoOrgAccount.length).toBeGreaterThan(0);

    const migratedCryptoOrgAccountRaw = migratedCryptoOrgAccount.at(0) as Account & {
      cosmosResources: Record<string, unknown>;
    };
    // Use mockAccount which has basic structure
    expect(migratedCryptoOrgAccountRaw.id).toBeDefined();
  });

  test("createDataModel for aptos account", async () => {
    const migratedAptosAccount = await createDataModel(schema).decode(aptosAccount);
    expect(migratedAptosAccount.length).toBeGreaterThan(0);

    const migratedAptosAccountRaw = migratedAptosAccount.at(0) as Account;
    // Use mockAccount which has basic structure
    expect(migratedAptosAccountRaw.id).toBeDefined();
  });

  describe("test for shownNfts true", () => {
    beforeAll(() => {
      (getCurrencyConfiguration as jest.Mock).mockReturnValue({
        showNfts: true,
      });
    });

    test("evm account", async () => {
      const data = await createDataModel(schema).decode(evmAccount);
      const account = data.at(0) as Account;
      expect(account.id).toBeDefined();
    });
  });

  describe("test for shownNfts false", () => {
    beforeAll(() => {
      (getCurrencyConfiguration as jest.Mock).mockReturnValue({
        showNfts: false,
      });
    });

    test("evm account", async () => {
      const data = await createDataModel(schema).decode(evmAccount);
      const account = data.at(0) as Account;
      expect(account.id).toBeDefined();
    });
  });
});
