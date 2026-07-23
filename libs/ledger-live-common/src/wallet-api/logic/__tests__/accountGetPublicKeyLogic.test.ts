import { accountGetPublicKeyLogic } from "../accountGetPublicKey";
import * as converters from "../../converters";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { createContextContainingAccountId, createTokenAccount } from "./testHelpers";
import { AccountPublicKeyUnavailable } from "../../../errors";

jest.mock("../../converters", () => ({
  ...jest.requireActual("../../converters"),
  getAccountIdFromWalletAccountId: jest.fn(),
  accountToWalletAPIAccount: jest.fn(),
}));

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const mockedGetAccountIdFromWalletAccountId = jest.mocked(
  converters.getAccountIdFromWalletAccountId,
);

describe("accountGetPublicKeyLogic", () => {
  // Given
  const mockAccountGetPublicKeyRequested = jest.fn();
  const mockAccountGetPublicKeyFail = jest.fn();
  const mockAccountGetPublicKeySuccess = jest.fn();

  const tezosCrypto = CRYPTO_CURRENCIES_REGISTRY["tezos"];
  const tezosAccountId = "js:2:tezos:0x013:";
  const tezosPublicKey = "edpkuBknW28nW72KG6RoHtYW7p12T6GKc7nAbwYX5m8Wd9sDVC9yav";

  const context = createContextContainingAccountId({
    tracking: {
      accountGetPublicKeyRequested: mockAccountGetPublicKeyRequested,
      accountGetPublicKeyFail: mockAccountGetPublicKeyFail,
      accountGetPublicKeySuccess: mockAccountGetPublicKeySuccess,
    },
    accountsParams: [{ id: "11" }, { id: "12" }, { id: "13", currency: tezosCrypto }],
  });

  beforeEach(() => {
    mockAccountGetPublicKeyRequested.mockClear();
    mockAccountGetPublicKeyFail.mockClear();
    mockAccountGetPublicKeySuccess.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
    // xpub holds the base58 account public key for a device-healed tezos account; reset the
    // fixture address too so a test that overrides it for a specific curve doesn't leak.
    const tezosAccount = context.accounts.find(a => a.id === tezosAccountId);
    if (tezosAccount?.type === "Account") {
      tezosAccount.xpub = tezosPublicKey;
      tezosAccount.freshAddress = "0x01";
    }
  });

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

  it.each([
    {
      desc: "receive unknown accountId",
      accountId: undefined,
      errorMessage: `accountId ${walletAccountId} unknown`,
    },
    {
      desc: "account not found",
      accountId: "js:2:ethereum:0x010:",
      errorMessage: "account not found",
    },
    {
      desc: "account family has no resolver",
      accountId: "js:2:ethereum:0x012:",
      errorMessage: "account.getPublicKey not implemented",
    },
  ])("returns an error when $desc", async ({ accountId, errorMessage }) => {
    // Given
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    await expect(async () => {
      await accountGetPublicKeyLogic(context, walletAccountId);
    }).rejects.toThrow(errorMessage);

    // Then
    expect(mockAccountGetPublicKeyRequested).toHaveBeenCalledTimes(1);
    expect(mockAccountGetPublicKeyFail).toHaveBeenCalledTimes(1);
    expect(mockAccountGetPublicKeySuccess).toHaveBeenCalledTimes(0);
  });

  it("returns the public key for a tezos account", async () => {
    // Given
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(tezosAccountId);

    // When
    const result = await accountGetPublicKeyLogic(context, walletAccountId);

    // Then
    expect(result).toEqual(tezosPublicKey);
    expect(mockAccountGetPublicKeyRequested).toHaveBeenCalledTimes(1);
    expect(mockAccountGetPublicKeyFail).toHaveBeenCalledTimes(0);
    expect(mockAccountGetPublicKeySuccess).toHaveBeenCalledTimes(1);
  });

  it("returns the normalized base58 public key when xpub is a hex key", async () => {
    // Given a device-output hex public key and a matching tz2 (secp256k1) address
    const tezosAccount = context.accounts.find(a => a.id === tezosAccountId);
    if (tezosAccount?.type === "Account") {
      tezosAccount.freshAddress = "tz2F4XnSd1wjwWsthemvZQjoPER7NVSt35k3";
      tezosAccount.xpub = "03576c19462a7d0cc3d121b1b00e92258b5f71d643c99a599fc1683f03abb7a1c2";
    }
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(tezosAccountId);

    // When
    const result = await accountGetPublicKeyLogic(context, walletAccountId);

    // Then it is normalized to base58
    expect(result).toEqual("sppk7but7h93Ws1XhAPvdBcttVmoBDGHxdpaU8dPy5549f3eLJFAjag");
    expect(mockAccountGetPublicKeyFail).toHaveBeenCalledTimes(0);
    expect(mockAccountGetPublicKeySuccess).toHaveBeenCalledTimes(1);
  });

  it("returns the parent public key for a tezos token account", async () => {
    // Given a token account whose parent is the tezos main account
    const tokenAccountId = "js:2:tezos:0x013:+token";
    context.accounts = [createTokenAccount(tokenAccountId, tezosAccountId), ...context.accounts];
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(tokenAccountId);

    // When
    const result = await accountGetPublicKeyLogic(context, walletAccountId);

    // Then
    expect(result).toEqual(tezosPublicKey);
    expect(mockAccountGetPublicKeyFail).toHaveBeenCalledTimes(0);
    expect(mockAccountGetPublicKeySuccess).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      desc: "xpub holds an address instead of a public key",
      xpub: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
    },
    { desc: "xpub holds a malformed hex key", xpub: "00aabbccdd" },
    { desc: "xpub is empty", xpub: "" },
  ])(
    "rejects with AccountPublicKeyUnavailable (and tracks failure) when $desc",
    async ({ xpub }) => {
      // Given a tezos account whose xpub cannot be normalized to a base58 public key
      const tezosAccount = context.accounts.find(a => a.id === tezosAccountId);
      if (tezosAccount?.type === "Account") tezosAccount.xpub = xpub;
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(tezosAccountId);

      // When / Then
      await expect(accountGetPublicKeyLogic(context, walletAccountId)).rejects.toThrow(
        AccountPublicKeyUnavailable,
      );
      expect(mockAccountGetPublicKeyFail).toHaveBeenCalledTimes(1);
      expect(mockAccountGetPublicKeySuccess).toHaveBeenCalledTimes(0);
    },
  );

  it("rejects (and tracks failure) when a token account's parent is missing", async () => {
    // Given a token account whose parent is not in the accounts list
    const tokenAccountId = "js:2:tezos:0xorphan:+token";
    context.accounts = [
      createTokenAccount(tokenAccountId, "js:2:tezos:0xmissing:"),
      ...context.accounts,
    ];
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(tokenAccountId);

    // When / Then — getParentAccount throws; it must surface as a rejection, not a sync throw
    await expect(accountGetPublicKeyLogic(context, walletAccountId)).rejects.toThrow(
      "account not found",
    );
    expect(mockAccountGetPublicKeyFail).toHaveBeenCalledTimes(1);
    expect(mockAccountGetPublicKeySuccess).toHaveBeenCalledTimes(0);
  });
});

describe("accountGetPublicKeyLogic (cosmos)", () => {
  const mockAccountGetPublicKeyRequested = jest.fn();
  const mockAccountGetPublicKeyFail = jest.fn();
  const mockAccountGetPublicKeySuccess = jest.fn();

  const cosmosCrypto = CRYPTO_CURRENCIES_REGISTRY["cosmos"];
  const cosmosAccountId = "js:2:cosmos:0x013:";
  const cosmosPublicKey = "03a1b2c3";

  const context = createContextContainingAccountId({
    tracking: {
      accountGetPublicKeyRequested: mockAccountGetPublicKeyRequested,
      accountGetPublicKeyFail: mockAccountGetPublicKeyFail,
      accountGetPublicKeySuccess: mockAccountGetPublicKeySuccess,
    },
    accountsParams: [{ id: "13", currency: cosmosCrypto }],
  });

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

  const setCosmosPublicKey = (publicKey: string | undefined) => {
    const account = context.accounts.find(a => a.id === cosmosAccountId);
    // the per-account pubkey is persisted in cosmosResources at scan time
    if (account?.type === "Account")
      (account as unknown as { cosmosResources: unknown }).cosmosResources = { publicKey };
  };

  beforeEach(() => {
    mockAccountGetPublicKeyRequested.mockClear();
    mockAccountGetPublicKeyFail.mockClear();
    mockAccountGetPublicKeySuccess.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
    setCosmosPublicKey(cosmosPublicKey);
  });

  it("returns the persisted public key for a cosmos account", async () => {
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(cosmosAccountId);

    const result = await accountGetPublicKeyLogic(context, walletAccountId);

    expect(result).toEqual(cosmosPublicKey);
    expect(mockAccountGetPublicKeyFail).toHaveBeenCalledTimes(0);
    expect(mockAccountGetPublicKeySuccess).toHaveBeenCalledTimes(1);
  });

  it.each([
    { desc: "empty (account synced before publicKey was persisted)", publicKey: "" },
    { desc: "absent (publicKey field unset)", publicKey: undefined },
  ])("rejects when the persisted public key is $desc", async ({ publicKey }) => {
    setCosmosPublicKey(publicKey);
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(cosmosAccountId);

    await expect(accountGetPublicKeyLogic(context, walletAccountId)).rejects.toThrow(
      "account.getPublicKey not implemented",
    );
    expect(mockAccountGetPublicKeyFail).toHaveBeenCalledTimes(1);
    expect(mockAccountGetPublicKeySuccess).toHaveBeenCalledTimes(0);
  });
});
