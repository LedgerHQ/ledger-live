// @flow
import { BigNumber } from "bignumber.js";
import { reduce } from "rxjs/operators";
import type { Account, SyncConfig } from "../../types";
import { getCryptoCurrencyById } from "../../currencies";
import { emptyHistoryCache } from "../../account";
import { getOperationAmountNumberWithInternals } from "../../operation";
import { makeSync } from "../../bridge/jsHelpers";
import { getAccountShape } from "./synchronisation";

const accounts = [
  "tz1ZL36Xw6LJ9RK6tb7QW85o7SVYfFKSMw8c",
  "tz1VacAyLcnHU3pEY3VNNK45F1CvVyTYXA3z",
  "tz1hpWkvAVVgftPy4CW8rD3u6tdVd8g1RU58",
  "tz1c3uVCiwmSi6paviyFTTtw5FZzirra5UGi",
  "tz1bdUiDiGTRBwYt4vrQCduK8owRifPH8qHQ",
  "tz1LZKsmjTLAp9ivh78uB6e2DtDgxQC5pswr",
  "tz1YqhBW53qSagbaq6CbQj67wXQsUouDSxyJ",
  "tz1hVVPTQZ5vHkWfWPcQ6qHPidPvtKWAPsMM",
  "tz1TeawWFnUmeP1qQLf4JWe5D7LaNp1qxgMW",
  "tz1Ykf4ssUxaRLMNeAaZE9MuSEFmsGUpRJq1",
  "tz1PTxfn1fge2tJwGGpW9zNuYf6BseM3GJXt",
  "tz1SBHto1BasGvxojr48r5PFiGb1Wq4cynGY",
  "tz1fAfYNSkgci3ko2xikDtYtcSf1X1YdAKoK",
];

jest.setTimeout(30 * 1000);

accounts.forEach((address) => {
  describe(address + " account works", () => {
    test("sum of ops is balance", async () => {
      const account = await syncAccount(makeAccountObject(address));
      expectSumOfOpsIsBalance(account);
    });
  });
});

const tezos = getCryptoCurrencyById("tezos");

function expectSumOfOpsIsBalance(account) {
  expect(
    account.operations
      .reduce(
        (acc, op) => getOperationAmountNumberWithInternals(op).plus(acc),
        new BigNumber(0)
      )
      .toString()
  ).toEqual(account.balance.toString());
}

const sync = makeSync(getAccountShape);

const defaultSyncConfig = {
  paginationConfig: {},
  blacklistedTokenIds: [],
};

export function syncAccount(
  account: Account,
  syncConfig: SyncConfig = defaultSyncConfig
): Promise<Account> {
  return sync(account, syncConfig)
    .pipe(reduce((a, f: (Account) => Account) => f(a), account))
    .toPromise();
}

function makeAccountObject(address): Account {
  return {
    type: "Account",
    id: "js:1:tezos:" + address + ":",
    derivationMode: "",
    seedIdentifier: "",
    name: "Tezos",
    starred: false,
    used: false,
    currency: tezos,
    index: 0,
    freshAddress: address,
    freshAddressPath: "",
    swapHistory: [],
    // these fields will be completed as we will sync
    freshAddresses: [],
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    unit: tezos.units[0],
    lastSyncDate: new Date(0),
    creationDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
  };
}
