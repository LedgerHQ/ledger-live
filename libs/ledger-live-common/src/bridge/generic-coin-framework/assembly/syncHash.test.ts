import { decodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { addressAccountId, isSyncFromScratch, tokensSyncHash } from "./syncHash";

jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account/index"),
  getSyncHash: jest.fn(async () => "0xtokens"),
}));

describe("tokensSyncHash", () => {
  it("hashes the currency's tokens and the blacklist, versioned by the family's syncVersion", async () => {
    await expect(
      tokensSyncHash("hedera", { paginationConfig: {}, blacklistedTokenIds: ["t"] }, {}),
    ).resolves.toBe("0xtokens");
    expect(getSyncHash).toHaveBeenCalledWith("hedera", ["t"]);

    await expect(
      tokensSyncHash("hedera", { paginationConfig: {} }, { syncVersion: "1" }),
    ).resolves.toBe("0xtokens-1");
  });
});

const synced = (fields: Partial<Account>) =>
  ({ blockHeight: 10, syncHash: "h", ...fields }) as Account;

describe("isSyncFromScratch", () => {
  it("lists from scratch a new account, a never synced one, or one synced under another hash", () => {
    expect(isSyncFromScratch(undefined, "h")).toBe(true);
    expect(isSyncFromScratch(synced({ blockHeight: 0 }), "h")).toBe(true);
    expect(isSyncFromScratch(synced({ syncHash: "other" }), "h")).toBe(true);
    expect(isSyncFromScratch(synced({}), "h")).toBe(false);
  });
});

describe("addressAccountId", () => {
  const currency = getCryptoCurrencyById("hedera");
  const info = {
    currency,
    address: "0.0.1",
    index: 0,
    derivationPath: "44'/3030",
    derivationMode: "" as const,
  };

  it("keys an account on its address", () => {
    expect(decodeAccountId(addressAccountId(info, {}))).toMatchObject({
      currencyId: "hedera",
      xpubOrAddress: "0.0.1",
    });
  });

  it("keys the account of a family keyed on the public key on the device key", () => {
    const id = addressAccountId(
      { ...info, rest: { publicKey: "pub" } },
      { accountIdFromPublicKey: true },
    );
    expect(decodeAccountId(id)).toMatchObject({ xpubOrAddress: "pub" });
  });
});
