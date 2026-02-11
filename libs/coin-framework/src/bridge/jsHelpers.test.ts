import { getCryptoCurrencyById, listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import type {
  Account,
  Operation,
  SyncConfig,
  TokenAccount,
  TransactionCommon,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import {
  AccountShapeInfo,
  bip32asBuffer,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "./jsHelpers";
import { createEmptyHistoryCache } from "../account/balanceHistoryCache";

describe("updateTransaction", () => {
  it("should not update the transaction object", () => {
    const transaction: TransactionCommon = {
      recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
      amount: new BigNumber("10000000000000"),
    };

    const updatedTransaction = updateTransaction(transaction, {
      recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
      amount: new BigNumber("10000000000000"),
    });

    expect(transaction).toBe(updatedTransaction);
  });

  it("should update the transaction object", () => {
    const transaction: TransactionCommon = {
      recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
      amount: new BigNumber("10000000000000"),
    };

    const updatedTransaction = updateTransaction(transaction, {
      recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
      amount: new BigNumber("20000000000000"),
    });

    expect(transaction).not.toBe(updatedTransaction);

    expect(updatedTransaction).toEqual({
      ...transaction,
      amount: new BigNumber("20000000000000"),
    });
  });
});

describe("makeSync", () => {
  it("returns a function to update account that give a new instance of account", async () => {
    // Given
    const account = createAccount({
      id: "12",
      creationDate: new Date("2024-05-12T17:04:12"),
      lastSyncDate: new Date("2024-05-12T17:04:12"),
    });

    // When
    const accountUpdater = makeSync({
      getAccountShape: (_accountShape: AccountShapeInfo) => Promise.resolve({} as Account),
    })(account, {} as SyncConfig);
    const updater = await firstValueFrom(accountUpdater);
    const newAccount = updater(account);

    // Then
    const nonUpdatedFields = {
      ...account,
      id: expect.any(String),
      creationDate: expect.any(Date),
      lastSyncDate: expect.any(Date),
      subAccounts: [],
    };
    expect(newAccount).toEqual(nonUpdatedFields);
    expect(newAccount.id).not.toEqual(account.id);
    expect(newAccount.creationDate).not.toEqual(account.creationDate);
    expect(newAccount.lastSyncDate).not.toEqual(account.lastSyncDate);
  });

  it("returns a account with a corrected formatted id", async () => {
    // Given
    const account = createAccount({
      id: "12",
      creationDate: new Date("2024-05-12T17:04:12"),
      lastSyncDate: new Date("2024-05-12T17:04:12"),
    });

    // When
    const accountUpdater = makeSync({
      getAccountShape: (_accountShape: AccountShapeInfo) => Promise.resolve({} as Account),
    })(account, {} as SyncConfig);
    const updater = await firstValueFrom(accountUpdater);
    const newAccount = updater(account);

    // Then
    const expectedAccount = {
      ...account,
      id: "js:2:bitcoin::",
      subAccounts: undefined,
    };
    expect(newAccount.id).toEqual(expectedAccount.id);
  });

  it("does not add customData when not present", async () => {
    // Given
    const account = createAccount({
      id: `js:2:bitcoin::`,
      creationDate: new Date("2024-05-12T17:04:12"),
      lastSyncDate: new Date("2024-05-12T17:04:12"),
    });

    // When
    const accountUpdater = makeSync({
      getAccountShape: (_accountShape: AccountShapeInfo) => Promise.resolve({} as Account),
    })(account, {} as SyncConfig);
    const updater = await firstValueFrom(accountUpdater);
    const newAccount = updater(account);

    // Then
    expect(newAccount.id).toEqual("js:2:bitcoin::");
    expect(newAccount.id).not.toContain("specific-chain-data");
  });

  it("preserves customData in account.id when present", async () => {
    // Given
    const customData = "specific-chain-data";
    const account = createAccount({
      id: `js:2:bitcoin:::${customData}`,
      creationDate: new Date("2024-05-12T17:04:12"),
      lastSyncDate: new Date("2024-05-12T17:04:12"),
    });

    // When
    const accountUpdater = makeSync({
      getAccountShape: (_accountShape: AccountShapeInfo) => Promise.resolve({} as Account),
    })(account, {} as SyncConfig);
    const updater = await firstValueFrom(accountUpdater);
    const newAccount = updater(account);

    // Then
    expect(newAccount.id).toEqual(account.id);
  });
});

describe("makeScanAccounts", () => {
  it("calls postSync with initial and final account", async () => {
    // Given
    const addressResolver = {
      address: "address",
      path: "m/44'/0'/0'/0/0",
      publicKey: "publicKey",
    };
    const currency = getCryptoCurrencyById("algorand");

    const postSync = jest.fn((_initial, synced) => ({
      ...synced,
      // inject a custom field to assert transformation took place
      blockHeight: 1234,
    }));

    const scanAccounts = makeScanAccounts({
      getAccountShape: () =>
        Promise.resolve({
          id: "acc-id", // mandatory
          balanceHistoryCache: createEmptyHistoryCache(),
        }),
      getAddressFn: () => Promise.resolve(addressResolver),
      postSync,
    });

    // When
    const result = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "deviceId",
        syncConfig: { paginationConfig: {} },
      }),
    );

    // Then
    expect(result.account.blockHeight).toBe(1234);
    expect(postSync).toHaveBeenCalledTimes(1);
    const [initialArg, syncedArg] = postSync.mock.calls[0];
    // initial account should not yet have blockHeight 1234
    expect(initialArg.blockHeight).toBe(0);
    // synced account is the version before postSync transformation (blockHeight still 0 there)
    expect(syncedArg.blockHeight).toBe(0);
  });

  it("returns the first account found when there is no one used previously", async () => {
    // Given
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };
    const syncConfig = {
      paginationConfig: {},
    };
    const deviceId = "deviceId";
    const currency = getCryptoCurrencyById("algorand");

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape: (accountShape, config) => {
        expect(config).toBe(syncConfig);
        expect(accountShape.currency).toBe(currency);
        expect(accountShape.address).toBe(addressResolver.address);
        expect(accountShape.derivationPath).toBe(addressResolver.path);
        expect(accountShape.deviceId).toBe(deviceId);
        return Promise.resolve({
          id: "1234",
          balanceHistoryCache: createEmptyHistoryCache(),
        });
      },
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    // Then
    const result = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId,
        syncConfig,
      }),
    );

    expect(result).toEqual({
      account: {
        id: "1234",
        balance: new BigNumber("0"),
        balanceHistoryCache: createEmptyHistoryCache(),
        blockHeight: 0,
        creationDate: expect.any(Date),
        currency,
        derivationMode: "",
        freshAddress: addressResolver.address,
        freshAddressPath: addressResolver.path,
        index: 0,
        lastSyncDate: expect.any(Date),
        operations: [],
        operationsCount: 0,
        pendingOperations: [],
        seedIdentifier: addressResolver.publicKey,
        spendableBalance: new BigNumber("0"),
        swapHistory: [],
        type: "Account",
        used: false,
      },
      type: "discovered",
    });
  });

  it("throws an error when the GetAccountShape does not return an id", async () => {
    // Given
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape: () =>
        Promise.resolve({
          balanceHistoryCache: createEmptyHistoryCache(),
        }),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    // Then
    expect(
      firstValueFrom(
        scanAccounts({
          currency: getCryptoCurrencyById("algorand"),
          deviceId: "deviceId",
          syncConfig: {
            paginationConfig: {},
          },
        }),
      ),
    ).rejects.toThrow("account ID must be provided");
  });

  it("throws an error when the GetAccountShape returns an incorrect balance", async () => {
    // Given
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape: () =>
        Promise.resolve({
          id: "1234",
          balance: new BigNumber("NULL"),
          balanceHistoryCache: createEmptyHistoryCache(),
        }),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    // Then
    expect(
      firstValueFrom(
        scanAccounts({
          currency: getCryptoCurrencyById("algorand"),
          deviceId: "deviceId",
          syncConfig: {
            paginationConfig: {},
          },
        }),
      ),
    ).rejects.toThrow("invalid balance NaN");
  });

  it.each([
    {
      balance: new BigNumber(1_000_000),
      operationsCount: 0,
    },
    {
      balance: new BigNumber(0),
      operationsCount: 1,
    },
    {
      balance: new BigNumber(0),
      operations: [{}] as Operation[],
    },
    {
      balance: new BigNumber(0),
      operationsCount: 0,
      subAccounts: [{}] as TokenAccount[],
    },
  ])("returns an account flag as used", async account => {
    // Given
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };
    const currency = getCryptoCurrencyById("algorand");

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape: () =>
        Promise.resolve({
          ...account,
          id: "1234",
          balanceHistoryCache: createEmptyHistoryCache(),
        }),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    // Then
    const result = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "deviceId",
        syncConfig: {
          paginationConfig: {},
        },
      }),
    );

    expect(result.account.used).toBe(true);
  });

  it.each([
    {
      account: {
        balance: new BigNumber(0),
      },
      expectedUsed: false,
    },
    {
      account: {
        balance: new BigNumber(0),
        used: true,
      },
      expectedUsed: true,
    },
    {
      account: {
        balance: new BigNumber(1_000_000),
        used: false,
      },
      expectedUsed: false,
    },
    {
      account: {
        balance: new BigNumber(1_000_000),
      },
      expectedUsed: true,
    },
  ])(
    "overrides the used flag only if not returned by the getAccountShape",
    async ({ account, expectedUsed }) => {
      // Given
      const addressResolver = {
        address: "address",
        path: "path",
        publicKey: "publicKey",
      };
      const currency = getCryptoCurrencyById("algorand");

      // When
      const scanAccounts = makeScanAccounts({
        getAccountShape: () =>
          Promise.resolve({
            ...account,
            id: "1234",
            balanceHistoryCache: createEmptyHistoryCache(),
          }),
        getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
      });

      // Then
      const result = await firstValueFrom(
        scanAccounts({
          currency,
          deviceId: "deviceId",
          syncConfig: {
            paginationConfig: {},
          },
        }),
      );

      expect(result.account.used).toEqual(expectedUsed);
    },
  );

  it("returns all accounts found until the first not used yet", done => {
    // Given
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };

    const USED_ACCOUNT_NUMN = 2;
    let scanCall = 0;
    const scanAccounts = makeScanAccounts({
      getAccountShape: () => {
        scanCall++;
        const used = scanCall > USED_ACCOUNT_NUMN ? false : true;
        return Promise.resolve({
          used,
          id: `1234${scanCall}`,
          balanceHistoryCache: createEmptyHistoryCache(),
        });
      },
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    // When
    let subscribeCalled = 0;
    scanAccounts({
      currency: getCryptoCurrencyById("algorand"),
      deviceId: "deviceId",
      syncConfig: {
        paginationConfig: {},
      },
    }).subscribe({
      // Then
      next: ({ account, type }) => {
        subscribeCalled++;
        expect(type).toEqual("discovered");
        expect(["12341", "12342", "12343"]).toContain(account.id);
        if (account.id === "12343") {
          expect(account.used).toBeFalsy();
        } else {
          expect(account.used).toBeTruthy();
        }
      },
      complete: () => {
        try {
          // Expect that the 3 account have been found, 2 existing one + the usuned one
          expect(subscribeCalled).toEqual(USED_ACCOUNT_NUMN + 1);
          done();
        } catch (e) {
          done(e);
        }
      },
    });
  });
});

describe("bip32asBuffer", () => {
  it.each([
    {
      name: "Simple",
      derivationPath: "m/44'/1/1/0",
      expectedResult: "048000002c000000010000000100000000",
    },
    {
      name: "Hardened coin type",
      derivationPath: "m/44'/1'/1/0",
      expectedResult: "048000002c800000010000000100000000",
    },
    {
      name: "Hardened account",
      derivationPath: "m/44'/1'/1'/0",
      expectedResult: "048000002c800000018000000100000000",
    },
  ])("converts path for AppCoins with $name case", ({ derivationPath, expectedResult }) => {
    const path = bip32asBuffer(derivationPath);
    expect(path).toEqual(Buffer.from(expectedResult, "hex"));
  });
});

// Call once for all tests the currencies. Relies on real implementation to check also consistency.
const bitcoinCurrency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;
function createAccount(init: Partial<Account>): Account {
  const currency = bitcoinCurrency;

  return {
    type: "Account",
    id: init.id ?? "12",
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "",
    freshAddressPath: "",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: init.creationDate ?? new Date(),
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    // subAccounts: [],
    balanceHistoryCache: createEmptyHistoryCache(),
    swapHistory: [],
  };
}
