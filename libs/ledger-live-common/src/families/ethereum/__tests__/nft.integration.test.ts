import "../../../__tests__/test-helpers/setup";
import { reduce } from "rxjs/operators";
import { fromAccountRaw } from "../../../account";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../../bridge";
import { makeBridgeCacheSystem } from "../../../bridge/cache";

jest.setTimeout(200000);

const ethTestingAccounts: AccountRaw[] = [
  {
    id: "js:1:ethereum:0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a:",
    seedIdentifier: "0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a",
    name: "G4sp4rd",
    derivationMode: "",
    index: 0,
    freshAddress: "0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a",
    freshAddressPath: "44'/60'/0'/0/0",
    freshAddresses: [],
    pendingOperations: [],
    operations: [],
    currencyId: "ethereum",
    unitMagnitude: 18,
    balance: "",
    blockHeight: 0,
    lastSyncDate: "",
    xpub: "",
  },
];

const gaspardPolygonAccount: AccountRaw = {
  id: "js:1:polygon:0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a:",
  seedIdentifier: "0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a",
  name: "G4sp4rd",
  derivationMode: "",
  index: 0,
  freshAddress: "0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [],
  pendingOperations: [],
  operations: [],
  currencyId: "polygon",
  unitMagnitude: 18,
  balance: "",
  blockHeight: 0,
  lastSyncDate: "",
  xpub: "",
};

const gaspardBscAccount: AccountRaw = {
  id: "js:1:bsc:0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a:",
  seedIdentifier: "0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a",
  name: "G4sp4rd",
  derivationMode: "",
  index: 0,
  freshAddress: "0xb98d10d9f6d07ba283bfd21b2dfec050f9ae282a",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [],
  pendingOperations: [],
  operations: [],
  currencyId: "bsc",
  unitMagnitude: 18,
  balance: "",
  blockHeight: 0,
  lastSyncDate: "",
  xpub: "",
};

async function sync(account) {
  const bridge = getAccountBridge(account);
  const blacklistedTokenIds = [];
  const r = await bridge
    .sync(account, {
      paginationConfig: {},
      blacklistedTokenIds,
    })
    .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account))
    .toPromise();
  return r;
}

const localCache = {};
const cache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },
  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

ethTestingAccounts.forEach((a) => {
  describe(a.name + " NFT on ethereum", () => {
    let account = fromAccountRaw(a);

    test("first sync & have nfts", async () => {
      await cache.prepareCurrency(account.currency);
      account = await sync(account);
      expect(account.nfts?.length || 0).not.toBe(0);
    });

    test("no nft should be on quantity 0 or negative", () => {
      expect(account.nfts?.find((n) => !n.amount.gt(0))).toEqual(undefined);
    });

    test("remove half NFTs will restore them with half operations", async () => {
      const halfOps = Math.ceil(account.operations.length / 2);
      const copy = {
        ...account,
        operations: account.operations.slice(halfOps),
        nfts: account.nfts?.slice(Math.ceil((account.nfts?.length || 0) / 2)),
      };
      const resync = await sync(copy);
      expect(resync.nfts).toEqual(account.nfts);
    });
  });
});

describe.skip("gaspard NFT on polygon", () => {
  let account = fromAccountRaw(gaspardPolygonAccount);
  test("first sync", async () => {
    await cache.prepareCurrency(account.currency);
    account = await sync(account);
  });
  test(".nfts shouldn't be visible", () => {
    expect(account.nfts).toBeFalsy();
  });
});

describe("gaspard NFT on bsc", () => {
  let account = fromAccountRaw(gaspardBscAccount);
  test("first sync", async () => {
    await cache.prepareCurrency(account.currency);
    account = await sync(account);
  });
  test(".nfts shouldn't be visible", () => {
    expect(account.nfts).toBeFalsy();
  });
});
