import { getCryptoCurrencyById, listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import type {
  Account,
  Operation,
  SyncConfig,
  TokenAccount,
  TransactionCommon,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { firstValueFrom, Observable, of, throwError, take, toArray } from "rxjs";
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

  it("emits an updater for each Observable account shape", async () => {
    const account = createAccount({
      id: "12",
      creationDate: new Date("2024-05-12T17:04:12"),
      lastSyncDate: new Date("2024-05-12T17:04:12"),
    });
    const shapes = [{ balance: new BigNumber(10) }, { balance: new BigNumber(20) }];

    const accountUpdater = makeSync({
      getAccountShape: () => of(...shapes),
    })(account, {} as SyncConfig);

    const updaters = await firstValueFrom(accountUpdater.pipe(toArray()));
    const updatedAccounts = updaters.map(updater => updater(account));

    expect(updatedAccounts).toHaveLength(2);
    expect(updatedAccounts[0].spendableBalance).toEqual(new BigNumber(10));
    expect(updatedAccounts[1].spendableBalance).toEqual(new BigNumber(20));
  });

  it("propagates Observable errors from getAccountShape", async () => {
    const account = createAccount({
      id: "12",
      creationDate: new Date("2024-05-12T17:04:12"),
      lastSyncDate: new Date("2024-05-12T17:04:12"),
    });

    const accountUpdater = makeSync({
      getAccountShape: () => throwError(() => new Error("boom")),
    })(account, {} as SyncConfig);

    await expect(firstValueFrom(accountUpdater)).rejects.toThrow("boom");
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

  it("emits discovered events for each Observable account shape", async () => {
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };
    const currency = getCryptoCurrencyById("algorand");

    const scanAccounts = makeScanAccounts({
      getAccountShape: () =>
        of(
          {
            id: "1234",
            used: true,
            balanceHistoryCache: createEmptyHistoryCache(),
          },
          {
            id: "1234",
            used: true,
            balanceHistoryCache: createEmptyHistoryCache(),
          },
        ),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    const result = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "deviceId",
        syncConfig: { paginationConfig: {} },
      }).pipe(take(2), toArray()),
    );

    expect(result).toHaveLength(2);
    result.forEach(event => {
      expect(event.type).toEqual("discovered");
      expect(event.account.used).toBe(true);
    });
  });

  it("evaluates emptyCount only on final emission", async () => {
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };
    const currency = getCryptoCurrencyById("near");
    const seenIndexes: number[] = [];

    const scanAccounts = makeScanAccounts({
      getAccountShape: accountShape => {
        seenIndexes.push(accountShape.index);
        if (accountShape.index === 0) {
          return of(
            {
              id: "acc-0",
              used: false,
              balanceHistoryCache: createEmptyHistoryCache(),
            },
            {
              id: "acc-0",
              used: true,
              balanceHistoryCache: createEmptyHistoryCache(),
            },
          );
        }
        return of({
          id: `acc-${accountShape.index}`,
          used: false,
          balanceHistoryCache: createEmptyHistoryCache(),
        });
      },
      buildIterateResult: () =>
        Promise.resolve(async ({ index }) =>
          index > 1
            ? null
            : {
                address: `address-${index}`,
                path: `path-${index}`,
                publicKey: "publicKey",
              },
        ),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    const result = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "deviceId",
        syncConfig: { paginationConfig: {} },
        scheme: "nearbip44h",
      }).pipe(toArray()),
    );

    expect(seenIndexes).toEqual([0, 1]);
    expect(result.map(event => event.account.id)).toEqual(["acc-0", "acc-0", "acc-1"]);
  });

  it("respects scanAccountsConcurrency limit", async () => {
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };
    const currency = getCryptoCurrencyById("near");
    let inFlight = 0;
    let maxInFlight = 0;

    const scanAccounts = makeScanAccounts({
      getAccountShape: accountShape =>
        new Observable(subscriber => {
          inFlight++;
          maxInFlight = Math.max(maxInFlight, inFlight);
          subscriber.next({
            id: `acc-${accountShape.index}`,
            used: false,
            balanceHistoryCache: createEmptyHistoryCache(),
          });
          const timeout = setTimeout(() => {
            subscriber.complete();
          }, 10);
          return () => {
            clearTimeout(timeout);
            if (inFlight > 0) inFlight--;
          };
        }),
      buildIterateResult: () =>
        Promise.resolve(async ({ index }) =>
          index > 2
            ? null
            : {
                address: `address-${index}`,
                path: `path-${index}`,
                publicKey: "publicKey",
              },
        ),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    const scanPromise = firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "deviceId",
        syncConfig: { paginationConfig: {}, scanAccountsConcurrency: 2 } as SyncConfig,
        scheme: "nearbip44h",
      }).pipe(toArray()),
    );

    await scanPromise;

    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it("unsubscribes inner account$ when consumer stops synchronously", async () => {
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };
    const currency = getCryptoCurrencyById("algorand");
    let unsubscribed = false;

    const scanAccounts = makeScanAccounts({
      getAccountShape: () =>
        new Observable<Partial<Account>>(subscriber => {
          subscriber.next({
            id: "acc-0",
            used: true,
            balanceHistoryCache: createEmptyHistoryCache(),
          });
          const timeout = setTimeout(() => {
            subscriber.complete();
          }, 50);
          return () => {
            clearTimeout(timeout);
            unsubscribed = true;
          };
        }),
      buildIterateResult: () =>
        Promise.resolve(async ({ index }) =>
          index > 0
            ? null
            : {
                address: "address-0",
                path: "path-0",
                publicKey: "publicKey",
              },
        ),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "deviceId",
        syncConfig: { paginationConfig: {} },
      }).pipe(take(1)),
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(unsubscribed).toBe(true);
  });

  it("does not cancel in-flight subscriptions when early-stop triggers for a mode", async () => {
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };
    const currency = getCryptoCurrencyById("near");
    let longRunningCompleted = false;
    let longRunningUnsubscribed = false;

    const scanAccounts = makeScanAccounts({
      getAccountShape: accountShape =>
        new Observable(subscriber => {
          subscriber.next({
            id: `acc-${accountShape.index}`,
            used: false,
            balanceHistoryCache: createEmptyHistoryCache(),
          });
          if (accountShape.index === 0) {
            const timeout = setTimeout(() => {
              subscriber.complete();
            }, 5);
            return () => {
              clearTimeout(timeout);
            };
          }
          const timeout = setTimeout(() => {
            longRunningCompleted = true;
            subscriber.complete();
          }, 30);
          return () => {
            clearTimeout(timeout);
            longRunningUnsubscribed = true;
          };
        }),
      buildIterateResult: () =>
        Promise.resolve(async ({ index }) =>
          index > 1
            ? null
            : {
                address: `address-${index}`,
                path: `path-${index}`,
                publicKey: "publicKey",
              },
        ),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "deviceId",
        syncConfig: { paginationConfig: {}, scanAccountsConcurrency: 2 } as SyncConfig,
        scheme: "",
      }).pipe(toArray()),
    );

    expect(longRunningCompleted).toBe(true);
    expect(longRunningUnsubscribed).toBe(true);
  });

  it("continues scanning other derivation modes when early-stop triggers", async () => {
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };
    const currency = getCryptoCurrencyById("bitcoin");
    const seenModes = new Set<string>();

    const scanAccounts = makeScanAccounts({
      getAccountShape: accountShape => {
        seenModes.add(accountShape.derivationMode);
        return of(
          {
            id: `acc-${accountShape.derivationMode}`,
            used: true,
            balanceHistoryCache: createEmptyHistoryCache(),
          },
          {
            id: `acc-${accountShape.derivationMode}`,
            used: false,
            balanceHistoryCache: createEmptyHistoryCache(),
          },
        );
      },
      buildIterateResult: () =>
        Promise.resolve(async ({ index, derivationMode }) =>
          index > 0
            ? null
            : {
                address: `address-${derivationMode}`,
                path: `path-${derivationMode}`,
                publicKey: `publicKey-${derivationMode}`,
              },
        ),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    const result = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "deviceId",
        syncConfig: { paginationConfig: {} },
      }).pipe(toArray()),
    );

    const resultModes = new Set(result.map(event => event.account.derivationMode));
    expect(seenModes.size).toBeGreaterThan(1);
    expect(resultModes.size).toBeGreaterThan(1);
  });

  it("propagates Observable errors from getAccountShape", async () => {
    const addressResolver = {
      address: "address",
      path: "path",
      publicKey: "publicKey",
    };

    const scanAccounts = makeScanAccounts({
      getAccountShape: () => throwError(() => new Error("boom")),
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });

    await expect(
      firstValueFrom(
        scanAccounts({
          currency: getCryptoCurrencyById("algorand"),
          deviceId: "deviceId",
          syncConfig: { paginationConfig: {} },
        }),
      ),
    ).rejects.toThrow("boom");
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
    lastSyncDate: init.lastSyncDate ?? new Date(),
    // subAccounts: [],
    balanceHistoryCache: createEmptyHistoryCache(),
    swapHistory: [],
  };
}
