import { Account, AccountRaw, AccountUserData, Operation } from "@ledgerhq/types-live";
import { createDataModel } from "./DataModel";
import { fromAccountRaw, toAccountRaw } from "./account";
import { accountRawToAccountUserData } from "@ledgerhq/live-wallet/lib/store";

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
    freshAddressPath: "44'/637'/0'/0/0",
  } as AccountRaw,
  version: 1,
};

describe("DataModel", () => {
  test("createDataModel for crypto.org account", () => {
    const migratedCryptoOrgAccount = createDataModel(schema).decode(cryptoOrgAccount);
    expect(migratedCryptoOrgAccount.length === 1);

    const migratedCryptoOrgAccountRaw = migratedCryptoOrgAccount.at(0) as Account & {
      cosmosResources: Record<string, unknown>;
    };

    expect(migratedCryptoOrgAccountRaw.cosmosResources).toBeDefined;
  });

  test("createDataModel for aptos account", () => {
    const migratedAptosAccount = createDataModel(schema).decode(aptosAccount);
    expect(migratedAptosAccount.length === 1);

    const migratedAptosAccountRaw = migratedAptosAccount.at(0) as Account;

    expect(migratedAptosAccountRaw.freshAddressPath).toEqual("44'/637'/0'/0'/0'");
  });
});
