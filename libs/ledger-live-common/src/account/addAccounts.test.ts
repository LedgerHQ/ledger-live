import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { genAccount } from "../mock/account";
import { addAccountsAction, groupAddAccounts, sameAccountIdentity } from "./addAccounts";

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "0",
});

const used = genAccount("used", { operationsSize: 1 });
const empty = { ...genAccount("empty", { operationsSize: 0 }), used: false };

test("sameAccountIdentity matches on id, freshAddress or xpub", () => {
  expect(sameAccountIdentity(used, { ...used, freshAddress: "", xpub: "" })).toBe(true);
  expect(sameAccountIdentity(used, { ...empty, id: "other", xpub: "" })).toBe(false);
});

test("groupAddAccounts sections scanned accounts", () => {
  const { sections, alreadyEmptyAccount } = groupAddAccounts([empty], [used, empty], {
    scanning: false,
  });
  expect(sections.map(s => [s.id, s.data.map(a => a.id)])).toEqual([
    ["importable", [used.id]],
    ["creatable", []],
    ["imported", [empty.id]],
  ]);
  expect(alreadyEmptyAccount).toBe(empty);
});

test("groupAddAccounts keeps only the preferred derivation scheme as creatable", () => {
  const { sections } = groupAddAccounts([], [empty], {
    scanning: false,
    preferredNewAccountSchemes: ["native_segwit"],
  });
  expect(sections.find(s => s.id === "creatable")?.data).toEqual([]);
});

test("addAccountsAction dedupes, refreshes existing accounts and applies renamings", () => {
  const { payload } = addAccountsAction({
    existingAccounts: [empty],
    scannedAccounts: [used, { ...empty, blockHeight: 42 }],
    selectedIds: [used.id, empty.id],
    renamings: { [used.id]: "renamed" },
  });
  expect(payload.allAccounts.map(a => a.id)).toEqual([empty.id, used.id]);
  expect(payload.allAccounts[0].blockHeight).toBe(42);
  expect(payload.editedNames.get(used.id)).toBe("renamed");
});
