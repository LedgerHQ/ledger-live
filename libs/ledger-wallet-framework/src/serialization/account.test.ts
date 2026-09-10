import type { AccountReadiness, AccountRaw, OperationRaw } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency, TokenCurrency } from "../types";
import { setCryptoAssetsStore } from "../cryptoAssetsStore";
import { genAccount } from "../mocks/account";
import { inferSubOperations } from "./operation";
import { fromAccountRaw, toAccountRaw } from "./account";

const ethereum = getCryptoCurrencyById("ethereum") as unknown as CryptoCurrency;

beforeAll(() => {
  const store: Parameters<typeof setCryptoAssetsStore>[0] = {
    findTokenById: async () => undefined,
    findTokenByAddressInCurrency: async () => undefined,
    getTokensSyncHash: async () => "",
  };
  setCryptoAssetsStore(store);
});

describe("account serialization — readiness", () => {
  it("round-trips readiness through to/fromAccountRaw", async () => {
    const account = genAccount("readiness-acc", { currency: ethereum });
    account.subAccounts = [];
    const readiness: AccountReadiness = { ready: false, reason: "unrevealed" };
    account.readiness = readiness;

    const raw = toAccountRaw(account);
    expect(raw.readiness).toEqual(readiness);

    const back = await fromAccountRaw(raw);
    expect(back.readiness).toEqual(readiness);
  });

  it("leaves readiness undefined when absent", async () => {
    const account = genAccount("no-readiness-acc", { currency: ethereum });
    account.subAccounts = [];
    delete account.readiness;

    const raw = toAccountRaw(account);
    expect(raw.readiness).toBeUndefined();

    const back = await fromAccountRaw(raw);
    expect(back.readiness).toBeUndefined();
  });
});

describe("account serialization — sub-account operation indexing", () => {
  const token: TokenCurrency = {
    id: "ethereum/erc20/usd_tether__erc20_",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec",
    parentCurrency: ethereum,
  } as unknown as TokenCurrency;

  const makeOperationRaw = (id: string, hash: string, accountId: string): OperationRaw => ({
    id,
    hash,
    type: "IN",
    value: "0",
    fee: "0",
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId,
    date: new Date(0).toISOString(),
    extra: {},
  });

  // hash "shared-hash" appears in the sub-account's operations *and* pendingOperations, so
  // fromOperationRaw's per-parent-operation lookup has more than one sub-operation to collect —
  // otherwise a naive index that drops one of the two arrays would go unnoticed.
  const subAccountRaw = {
    type: "TokenAccountRaw" as const,
    id: "account-id+token",
    parentId: "account-id",
    tokenId: token.id,
    operations: [
      makeOperationRaw("sub-op-1", "shared-hash", "account-id+token"),
      makeOperationRaw("sub-op-2", "other-hash", "account-id+token"),
    ],
    pendingOperations: [makeOperationRaw("sub-pending-1", "shared-hash", "account-id+token")],
    balance: "100",
  };

  const rawAccount: AccountRaw = {
    id: "account-id",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "0xabc",
    freshAddressPath: "44'/60'/0'/0/0",
    balance: "0",
    blockHeight: 0,
    currencyId: "ethereum",
    operations: [makeOperationRaw("parent-op", "shared-hash", "account-id")],
    pendingOperations: [makeOperationRaw("parent-pending", "other-hash", "account-id")],
    subAccounts: [subAccountRaw],
  };

  beforeAll(() => {
    const store: Parameters<typeof setCryptoAssetsStore>[0] = {
      findTokenById: async (id: string) => (id === token.id ? token : undefined),
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    };
    setCryptoAssetsStore(store);
  });

  it("round-trips to an Account whose subOperations match inferSubOperations, same order", async () => {
    const account = await fromAccountRaw(rawAccount);

    expect(account.subAccounts).toHaveLength(1);
    const subAccounts = account.subAccounts!;

    // Built independently from the reference scan, per hash, so the index cannot be checked
    // against itself.
    expect(account.operations[0].subOperations?.map(op => op.id)).toEqual(
      inferSubOperations("shared-hash", subAccounts).map(op => op.id),
    );
    expect(account.operations[0].subOperations?.map(op => op.id)).toEqual([
      "sub-op-1",
      "sub-pending-1",
    ]);
    expect(account.pendingOperations[0].subOperations?.map(op => op.id)).toEqual(
      inferSubOperations("other-hash", subAccounts).map(op => op.id),
    );
    expect(account.pendingOperations[0].subOperations?.map(op => op.id)).toEqual(["sub-op-2"]);
  });

  it("degrades to empty operations when a token lookup fails, unperturbed by the index", async () => {
    const rawWithUnknownToken: AccountRaw = {
      ...rawAccount,
      subAccounts: [{ ...subAccountRaw, tokenId: "unknown-token-id" }],
    };

    const account = await fromAccountRaw(rawWithUnknownToken);

    expect(account.operations).toEqual([]);
    expect(account.pendingOperations).toEqual([]);
  });
});
