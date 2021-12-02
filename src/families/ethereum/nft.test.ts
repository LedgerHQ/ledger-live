import "../../__tests__/test-helpers/setup";
import { reduce } from "rxjs/operators";
import { fromAccountRaw, toAccountRaw } from "../../account";
import type { Account, AccountRaw } from "../../types";
import { getAccountBridge } from "../../bridge";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { patchAccount } from "../../reconciliation";
import { setEnv } from "../../env";

const gaspardAccount: AccountRaw = {
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
};

describe("nft reconciliation", () => {
  let account = fromAccountRaw(gaspardAccount);
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
  const bridge = getAccountBridge(account);
  async function sync(account) {
    const blacklistedTokenIds = [];
    setEnv("NFT", true);
    const r = await bridge
      .sync(account, {
        paginationConfig: {},
        blacklistedTokenIds,
      })
      .pipe(reduce((a, f: (arg0: Account) => Account) => f(a), account))
      .toPromise();
    setEnv("NFT", false);
    return r;
  }

  test("first sync & have nfts", async () => {
    await cache.prepareCurrency(account.currency);
    account = await sync(account);
    expect(account.nfts?.length || 0).not.toBe(0);
  });

  test("remove half NFTs will restore them with operations still here", async () => {
    const copy = {
      ...account,
      nfts: account.nfts?.slice(Math.ceil((account.nfts?.length || 0) / 2)),
    };
    const resync = await sync(copy);
    expect(resync.nfts).toEqual(account.nfts);
  });

  test("remove half NFTs will restore them with missing operations too", async () => {
    const copy = {
      ...account,
      operations: [],
      nfts: account.nfts?.slice(Math.ceil((account.nfts?.length || 0) / 2)),
    };
    const resync = await sync(copy);
    expect(resync.nfts).toEqual(account.nfts);
  });

  test("patchAccount restore new NFTs correctly", async () => {
    const copy = {
      ...account,
      operations: [],
      nfts: account.nfts?.slice(Math.ceil((account.nfts?.length || 0) / 2)),
    };
    const newAccount = patchAccount(copy, toAccountRaw(account));
    expect(newAccount.nfts).toEqual(account.nfts);
  });
});
