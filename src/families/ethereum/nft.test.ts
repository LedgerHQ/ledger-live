import "../../__tests__/test-helpers/setup";
import BigNumber from "bignumber.js";
import { reduce } from "rxjs/operators";
import { fromAccountRaw, toAccountRaw, toNFTRaw } from "../../account";
import type { Account, AccountRaw, NFT } from "../../types";
import { getAccountBridge } from "../../bridge";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { patchAccount } from "../../reconciliation";
import { setEnv } from "../../env";
import { mergeNfts } from "../../bridge/jsHelpers";
import { encodeNftId } from "../../nft";

jest.setTimeout(120000);

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

/*
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
*/

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

async function sync(account, withNFT = true) {
  const bridge = getAccountBridge(account);
  const blacklistedTokenIds = [];
  setEnv("NFT", withNFT);
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

describe("nft merging", () => {
  const makeNFT = (tokenId: string, contract: string, amount: number): NFT => ({
    id: encodeNftId("test", contract, tokenId),
    tokenId,
    amount: new BigNumber(amount),
    collection: {
      contract,
      standard: "erc721",
    },
  });
  const oldNfts = [
    makeNFT("1", "contract1", 10),
    makeNFT("2", "contract1", 1),
    makeNFT("3", "contract2", 6),
  ];

  test("should remove first NFT and return new array with same refs", () => {
    const nfts = [makeNFT("2", "contract1", 1), makeNFT("3", "contract2", 6)];
    const newNfts = mergeNfts(oldNfts, nfts);

    expect(newNfts.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[1]).toBe(newNfts[0]);
    expect(oldNfts[2]).toBe(newNfts[1]);
  });

  test("should remove any NFT and return new array with same refs", () => {
    const nfts = [makeNFT("1", "contract1", 10), makeNFT("3", "contract2", 6)];
    const newNfts = mergeNfts(oldNfts, nfts);

    expect(newNfts.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[0]).toBe(newNfts[0]);
    expect(oldNfts[2]).toBe(newNfts[1]);
  });

  test("should change NFT amount and return new array with new ref", () => {
    const nfts = [
      makeNFT("1", "contract1", 10),
      makeNFT("2", "contract1", 5),
      makeNFT("3", "contract2", 6),
    ];
    const addToNft1 = mergeNfts(oldNfts, nfts);

    expect(addToNft1.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[0]).toBe(addToNft1[0]);
    expect(oldNfts[1]).not.toBe(addToNft1[1]);
    expect(oldNfts[2]).toBe(addToNft1[2]);
  });

  test("should add NFT and return new array with new ref", () => {
    const nfts = [
      makeNFT("1", "contract1", 10),
      makeNFT("2", "contract1", 1),
      makeNFT("3", "contract2", 6),
      makeNFT("4", "contract2", 4),
    ];
    const addToNft1 = mergeNfts(oldNfts, nfts);

    expect(addToNft1.map(toNFTRaw)).toEqual(
      [
        makeNFT("4", "contract2", 4),
        makeNFT("1", "contract1", 10),
        makeNFT("2", "contract1", 1),
        makeNFT("3", "contract2", 6),
      ].map(toNFTRaw)
    );
    expect(oldNfts[0]).toBe(addToNft1[1]);
    expect(oldNfts[1]).toBe(addToNft1[2]);
    expect(oldNfts[2]).toBe(addToNft1[3]);
    expect(addToNft1[0]).toBe(nfts[3]);
  });
});

describe("gaspard NFT on ethereum", () => {
  let account = fromAccountRaw(gaspardAccount);

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

  test("patchAccount restore new NFTs correctly", async () => {
    const copy = {
      ...account,
      operations: [],
      nfts: account.nfts?.slice(Math.ceil((account.nfts?.length || 0) / 2)),
    };
    const newAccount = patchAccount(copy, toAccountRaw(account));
    expect(newAccount.nfts).toEqual(account.nfts);
  });

  test("start account with .nfts and disable the NFT flag should make it disappear", async () => {
    expect(account.nfts).not.toBeFalsy();
    const resync = await sync(account, false);
    expect(resync.nfts).toBeFalsy();
  });

  test("start account without .nfts and enable the NFT flag should make it appear", async () => {
    const first = await sync(account, false);
    expect(first.nfts).toBeFalsy();
    const second = await sync(first, true);
    expect(second.nfts).not.toBeFalsy();
    expect(second.nfts).toEqual(account.nfts);
  });

  test("no nft should be on quantity 0 or negative", async () => {
    expect(account.nfts?.find((n) => !n.amount.gt(0))).toEqual(undefined);
  });
});

/*
// this is never ending here... have to disable this test... (backend issue)
describe("gaspard NFT on polygon", () => {
  let account = fromAccountRaw(gaspardPolygonAccount);
  test("first sync", async () => {
    await cache.prepareCurrency(account.currency);
    account = await sync(account);
  });
  test(".nfts shouldn't be visible", () => {
    expect(account.nfts).toBeFalsy();
  });
});
*/

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
