import BigNumber from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { BitcoinAccountRaw } from "../../../types";
import type { BitcoinSigner, SignerContext } from "../../../signer";
import type { ZcashAccount, ZcashAccountRaw, ZcashPrivateInfo } from "../types";
import { getChainAdapter } from "../../registry";

// `index.ts` constructs `new DmkSignerZcash(...)` inside `createSigner`. The
// real implementation eagerly instantiates the device-management-kit pipeline
// which we don't want to spin up in unit tests.
const dmkSignerCtor = jest.fn();
jest.mock("@ledgerhq/live-signer-zcash", () => ({
  DmkSignerZcash: jest.fn().mockImplementation((...args) => {
    dmkSignerCtor(...args);
    return {
      __mockedDmkSignerZcash: true,
      args,
      getAddress: jest.fn(),
      getFullViewingKey: jest.fn(),
      createPaymentTransaction: jest.fn().mockResolvedValue("0500signedtx"),
    };
  }),
}));

import "../index";

// ─── Helpers ────────────────────────────────────────────────────────────

const adapter = getChainAdapter("zcash");
const currency = getCryptoCurrencyById("zcash");

/**
 * BIP-32 spec test vector 1, chain `m/0H`. Reused across `xpub.test.ts` and
 * here so `getWalletXpub` is verified against a published, byte-stable xpub.
 *
 * https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vector-1
 */
const MASTER_PUBKEY_HEX = "0339a36013301597daef41fbe593a02cc513d0b55527ec2df1050e2e8ff49c85c2";
const ACCOUNT_PUBKEY_HEX = "035a784662a4a20a65bf6aab9ae98a6c068a81c52e4b032c0fb5400c706cfccc56";
const ACCOUNT_CHAIN_CODE_HEX = "47fdacbd0f1097043b78c63c20c34ef4ed9a111d980047ad16282c7ae6236141";
const EXPECTED_M_0H_XPUB =
  "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw";
const XPUB_MAINNET_VERSION = 0x0488b21e;

/** Build a SignerContext that always invokes `fn` with the supplied signer. */
const makeSignerContext = (signer: unknown): jest.Mock & SignerContext => {
  const mock = jest.fn((_deviceId, _currency, fn) =>
    fn(signer as Parameters<typeof fn>[0]),
  ) as jest.Mock;
  return mock as jest.Mock & SignerContext;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── assignToAccountRaw / assignFromAccountRaw ─────────────────────────

describe("zcash chain adapter — privateInfo serialization", () => {
  const privateInfo: ZcashPrivateInfo = {
    saplingBalance: new BigNumber(1234),
    orchardBalance: new BigNumber(5678),
    syncState: "complete",
    progress: 100,
    estimatedTimeRemaining: { hours: 0, minutes: 0 },
    ufvk: "uview1key",
    birthday: "2024-01-01",
    lastSyncTimestamp: 1700000000,
    lastProcessedBlock: 5000,
    transactions: [],
  };

  it("serializes ZcashPrivateInfo into the raw form when present", () => {
    const account = { privateInfo } as unknown as Account;
    const accountRaw = {} as AccountRaw;

    adapter.assignToAccountRaw!(account, accountRaw);

    const raw = (accountRaw as ZcashAccountRaw).privateInfo!;
    expect(raw.saplingBalance).toBe("1234");
    expect(raw.orchardBalance).toBe("5678");
    expect(raw.ufvk).toBe("uview1key");
  });

  it("leaves accountRaw untouched when no privateInfo is set on the account", () => {
    const account = {} as Account;
    const accountRaw = { id: "acc-1" } as BitcoinAccountRaw;

    adapter.assignToAccountRaw!(account, accountRaw);

    expect((accountRaw as ZcashAccountRaw).privateInfo).toBeUndefined();
  });

  it("rehydrates ZcashPrivateInfoRaw into BigNumber-backed fields when present", () => {
    const accountRaw = {
      privateInfo: {
        saplingBalance: "1234",
        orchardBalance: "5678",
        syncState: "complete",
        progress: 100,
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
        ufvk: "uview1key",
        birthday: "2024-01-01",
        lastSyncTimestamp: 1700000000,
        lastProcessedBlock: 5000,
        transactions: [],
      },
    } as unknown as ZcashAccountRaw;
    const account = {} as Account;

    adapter.assignFromAccountRaw!(accountRaw, account);

    const restored = (account as ZcashAccount).privateInfo!;
    expect(restored.saplingBalance).toEqual(new BigNumber(1234));
    expect(restored.orchardBalance).toEqual(new BigNumber(5678));
    expect(restored.ufvk).toBe("uview1key");
  });

  it("leaves the account untouched when no privateInfo is present on the raw form", () => {
    const accountRaw = {} as AccountRaw;
    const account = {} as Account;

    adapter.assignFromAccountRaw!(accountRaw, account);

    expect((account as ZcashAccount).privateInfo).toBeUndefined();
  });
});

// PCZT placeholders (signOperation / getTransactionStatus / estimateMaxSpendable
// / prepareTransaction) are already exhaustively covered in `adapter.test.ts`
// for every `ZcashTransferType`, so we don't duplicate them here.

// ─── getAddress ────────────────────────────────────────────────────────

describe("zcash chain adapter — getAddress", () => {
  it("forwards path/verify to the signer and reshapes its response into a BitcoinAddress", async () => {
    const signer = {
      getAddress: jest.fn().mockResolvedValue({
        address: "t1abc",
        publicKey: ACCOUNT_PUBKEY_HEX,
        chainCode: ACCOUNT_CHAIN_CODE_HEX,
      }),
    };
    const signerContext = makeSignerContext(signer);

    const result = await adapter.getAddress!(
      "device-id",
      { currency, path: "44'/133'/0'/0/0", verify: true, derivationMode: "" },
      signerContext,
    );

    expect(signerContext).toHaveBeenCalledWith("device-id", currency, expect.any(Function));
    expect(signer.getAddress).toHaveBeenCalledWith("44'/133'/0'/0/0", true);
    expect(result).toEqual({
      bitcoinAddress: "t1abc",
      publicKey: ACCOUNT_PUBKEY_HEX,
      chainCode: ACCOUNT_CHAIN_CODE_HEX,
    });
  });

  it("defaults verify to false when not provided", async () => {
    const signer = {
      getAddress: jest.fn().mockResolvedValue({
        address: "t1abc",
        publicKey: ACCOUNT_PUBKEY_HEX,
        chainCode: ACCOUNT_CHAIN_CODE_HEX,
      }),
    };

    await adapter.getAddress!(
      "device-id",
      { currency, path: "44'/133'/0'/0/0", derivationMode: "" },
      makeSignerContext(signer),
    );

    expect(signer.getAddress).toHaveBeenCalledWith("44'/133'/0'/0/0", false);
  });

  it("rejects with a descriptive error when the resolved signer cannot getAddress", async () => {
    // The hw-app-btc bitcoin signer doesn't expose `getAddress(path, display)`;
    // hitting that path means the dispatcher gave us a non-Zcash signer.
    const wrongSigner = { foo: () => {} };

    await expect(
      adapter.getAddress!(
        "device-id",
        { currency, path: "44'/133'/0'/0/0", verify: false, derivationMode: "" },
        makeSignerContext(wrongSigner),
      ),
    ).rejects.toThrow(/Zcash signer must implement getAddress/);
  });
});

// ─── getWalletXpub ─────────────────────────────────────────────────────

describe("zcash chain adapter — getWalletXpub", () => {
  it("derives parent + account keys and produces the BIP-32 spec m/0H xpub", async () => {
    // Pick `accountPath = "0'"` so it matches BIP-32 test vector 1 chain m/0H,
    // giving us a published canonical xpub to assert against.
    const signer = {
      getAddress: jest.fn(async (path: string) => {
        if (path === "") {
          // Master `m`: only the public key contributes to the parent
          // fingerprint; chainCode is unused for the parent fetch.
          return { address: "", publicKey: MASTER_PUBKEY_HEX, chainCode: "00".repeat(32) };
        }
        if (path === "0'") {
          return {
            address: "",
            publicKey: ACCOUNT_PUBKEY_HEX,
            chainCode: ACCOUNT_CHAIN_CODE_HEX,
          };
        }
        throw new Error(`Unexpected path: ${path}`);
      }),
    };

    const xpub = await adapter.getWalletXpub!(
      "device-id",
      { currency, accountPath: "0'", xpubVersion: XPUB_MAINNET_VERSION },
      makeSignerContext(signer),
    );

    expect(signer.getAddress).toHaveBeenNthCalledWith(1, "", false);
    expect(signer.getAddress).toHaveBeenNthCalledWith(2, "0'", false);
    expect(xpub).toBe(EXPECTED_M_0H_XPUB);
  });

  it("derives parent path by stripping the trailing element of accountPath", async () => {
    const signer = {
      getAddress: jest.fn(async () => ({
        address: "",
        publicKey: ACCOUNT_PUBKEY_HEX,
        chainCode: ACCOUNT_CHAIN_CODE_HEX,
      })),
    };

    await adapter.getWalletXpub!(
      "device-id",
      {
        currency,
        accountPath: "44'/133'/0'",
        xpubVersion: XPUB_MAINNET_VERSION,
      },
      makeSignerContext(signer),
    );

    expect(signer.getAddress).toHaveBeenCalledWith("44'/133'", false);
    expect(signer.getAddress).toHaveBeenCalledWith("44'/133'/0'", false);
  });

  it("throws when accountPath is empty", async () => {
    const signer = { getAddress: jest.fn() };

    await expect(
      adapter.getWalletXpub!(
        "device-id",
        { currency, accountPath: "", xpubVersion: XPUB_MAINNET_VERSION },
        makeSignerContext(signer),
      ),
    ).rejects.toThrow(/Cannot derive xpub from empty path/);

    expect(signer.getAddress).not.toHaveBeenCalled();
  });

  it("rejects with a descriptive error when the resolved signer cannot getAddress", async () => {
    const wrongSigner = { foo: () => {} };

    await expect(
      adapter.getWalletXpub!(
        "device-id",
        { currency, accountPath: "0'", xpubVersion: XPUB_MAINNET_VERSION },
        makeSignerContext(wrongSigner),
      ),
    ).rejects.toThrow(/Zcash signer must implement getAddress/);
  });
});

// ─── getFullViewingKey ─────────────────────────────────────────────────

describe("zcash chain adapter — getFullViewingKey", () => {
  it("forwards path to the signer and unwraps viewKey from its response", async () => {
    const signer = {
      getFullViewingKey: jest.fn().mockResolvedValue({ viewKey: "uview1key" }),
    };
    const signerContext = makeSignerContext(signer);

    const result = await adapter.getFullViewingKey!(
      "device-id",
      currency,
      "44'/133'/0'",
      signerContext,
    );

    expect(signerContext).toHaveBeenCalledWith("device-id", currency, expect.any(Function));
    expect(signer.getFullViewingKey).toHaveBeenCalledWith("44'/133'/0'");
    expect(result).toBe("uview1key");
  });

  it("rejects with a descriptive error when the resolved signer cannot getFullViewingKey", async () => {
    // Non-Zcash signers (e.g. hw-app-btc) won't expose `getFullViewingKey`;
    // hitting this branch means the dispatcher handed us the wrong signer.
    const wrongSigner = { getAddress: () => {} };

    await expect(
      adapter.getFullViewingKey!(
        "device-id",
        currency,
        "44'/133'/0'",
        makeSignerContext(wrongSigner),
      ),
    ).rejects.toThrow(/Zcash signer must implement getFullViewingKey/);
  });

  it("propagates errors thrown by the underlying signer", async () => {
    const signer = {
      getFullViewingKey: jest.fn().mockRejectedValue(new Error("device locked")),
    };

    await expect(
      adapter.getFullViewingKey!("device-id", currency, "44'/133'/0'", makeSignerContext(signer)),
    ).rejects.toThrow("device locked");
  });
});

// ─── createSigner ─────────────────────────────────────────────────────

describe("zcash chain adapter — createSigner", () => {
  it("augments the default signer with DmkSignerZcash methods for DMK transport", () => {
    const dmk = { dmkSentinel: true };
    const sessionId = "session-42";
    const defaultSigner = { splitTransaction: jest.fn() } as unknown as BitcoinSigner;

    const signer = adapter.createSigner!({ dmk, sessionId }, currency, defaultSigner);

    expect(dmkSignerCtor).toHaveBeenCalledWith(dmk, sessionId);
    // Default signer is augmented in-place with DMK methods
    expect(signer).toBe(defaultSigner);
    expect(signer).toHaveProperty("getAddress");
    expect(signer).toHaveProperty("getFullViewingKey");
    expect(signer).toHaveProperty("createPaymentTransaction");
    // splitTransaction is a pure hex parser — kept from the default Btc signer
    expect(signer).toHaveProperty("splitTransaction");
  });

  it("routes transparent signing through the DMK createPaymentTransaction", async () => {
    const dmk = { dmkSentinel: true };
    // The legacy hw-app-btc createPaymentTransaction must be overridden, not used.
    // Capture its reference before createSigner mutates defaultSigner in place.
    const legacyCreatePaymentTransaction = jest
      .fn()
      .mockResolvedValue("LEGACY_SHOULD_NOT_BE_CALLED");
    const defaultSigner = {
      splitTransaction: jest.fn(),
      createPaymentTransaction: legacyCreatePaymentTransaction,
    } as unknown as BitcoinSigner;

    const signer = adapter.createSigner!({ dmk, sessionId: "s" }, currency, defaultSigner)!;

    const signed = await signer.createPaymentTransaction({
      inputs: [],
      associatedKeysets: [],
      outputScriptHex: "",
      additionals: ["zcash"],
    });

    expect(signed).toBe("0500signedtx");
    expect(legacyCreatePaymentTransaction).not.toHaveBeenCalled();
  });

  it("returns undefined for non-DMK transports (falls through to standard Btc)", () => {
    const defaultSigner = {} as BitcoinSigner;
    expect(adapter.createSigner!({}, currency, defaultSigner)).toBeUndefined();
    expect(adapter.createSigner!({ dmk: {} }, currency, defaultSigner)).toBeUndefined();
    // sessionId must be a string
    expect(
      adapter.createSigner!({ dmk: {}, sessionId: 123 }, currency, defaultSigner),
    ).toBeUndefined();
  });
});

// ─── adapter wiring ────────────────────────────────────────────────────

describe("zcash chain adapter — registration", () => {
  it("registers itself under the 'zcash' currency id", () => {
    expect(adapter.id).toBe("zcash");
  });

  it("exposes buildExtraSyncObservable for shielded sync delegation", () => {
    expect(typeof adapter.buildExtraSyncObservable).toBe("function");
  });
});
