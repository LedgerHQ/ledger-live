import { Account, AccountRaw, AccountUserData, Operation } from "@ledgerhq/types-live";
import { createDataModel } from "./DataModel";
import { fromAccountRaw, toAccountRaw } from "./account";
import { accountRawToAccountUserData } from "@ledgerhq/live-wallet/lib/store";
import {
  APTOS_HARDENED_DERIVATION_PATH,
  APTOS_NON_HARDENED_DERIVATION_PATH,
} from "./families/aptos/consts";
import { getCurrencyConfiguration } from "./config";
jest.mock("./config", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

const opRetentionStategy =
  (maxDaysOld: number, keepFirst: number) =>
  (op: Operation, index: number): boolean =>
    index < keepFirst || Date.now() - op.date.getTime() < 1000 * 60 * 60 * 24 * maxDaysOld;

const schema = {
  migrations: [raw => raw],
  decode: (raw: AccountRaw) => [fromAccountRaw(raw), accountRawToAccountUserData(raw)],
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
    currencyId: "crypto_org",
  } as AccountRaw,
  version: 1,
};

const aptosAccount = {
  data: {
    currencyId: "aptos",
    freshAddressPath: APTOS_NON_HARDENED_DERIVATION_PATH,
  } as AccountRaw,
  version: 1,
};

const evmAccount = {
  data: {
    currencyId: "ethereum",
    operations: [
      {
        id: "op_evm_001",
      },
      {
        id: "op_evm_002",
        nftOperations: [{ id: "op_evm_nft_001" }],
      },
    ],
  } as AccountRaw,
  version: 1,
};

describe("DataModel", () => {
  test("createDataModel for crypto.org account", () => {
    const migratedCryptoOrgAccount = createDataModel(schema).decode(cryptoOrgAccount);
    expect(migratedCryptoOrgAccount.length).toBeGreaterThan(0);

    const migratedCryptoOrgAccountRaw = migratedCryptoOrgAccount.at(0) as Account & {
      cosmosResources: Record<string, unknown>;
    };
    expect(migratedCryptoOrgAccountRaw.cosmosResources).toBeDefined();
  });

  test("createDataModel for aptos account", () => {
    const migratedAptosAccount = createDataModel(schema).decode(aptosAccount);
    expect(migratedAptosAccount.length).toBeGreaterThan(0);

    const migratedAptosAccountRaw = migratedAptosAccount.at(0) as Account;
    expect(migratedAptosAccountRaw.freshAddressPath).toEqual(APTOS_HARDENED_DERIVATION_PATH);
  });

  describe("test for shownNfts true", () => {
    beforeAll(() => {
      (getCurrencyConfiguration as jest.Mock).mockReturnValue({
        showNfts: true,
      });
    });

    test("evm account", () => {
      const data = createDataModel(schema).decode(evmAccount);
      const account = data.at(0) as Account;
      expect(account.operations).toEqual([
        expect.objectContaining({ id: "op_evm_001" }),
        expect.objectContaining({ id: "op_evm_002" }),
      ]);
    });
  });

  describe("test for shownNfts false", () => {
    beforeAll(() => {
      (getCurrencyConfiguration as jest.Mock).mockReturnValue({
        showNfts: false,
      });
    });

    test("evm account", () => {
      const data = createDataModel(schema).decode(evmAccount);
      const account = data.at(0) as Account;
      expect(account.operations).toEqual([expect.objectContaining({ id: "op_evm_001" })]);
    });
  });
});
