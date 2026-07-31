/* eslint @typescript-eslint/consistent-type-assertions: 0 */
/**
 * Tests for the Zcash PCZT signOperation orchestration.
 *
 * The ZCash module (ZCash.ts / ZCashIPC.ts) is mocked via jest.mock so the
 * test never touches the native .node addon. Device interactions are mocked
 * through the signerContext stub.
 */

import BigNumber from "bignumber.js";
import { Observable, firstValueFrom, lastValueFrom, toArray } from "rxjs";
import type { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { setZcashShieldedEnabled } from "../constants";
import { ZcashUtxoNotInAccount } from "../../../errors";
// Transaction lives in src/types.ts (coin-bitcoin), not in chain-adapters/types.ts
import type { Transaction } from "../../../types";
import type { SignerContext } from "../../../signer";
// Imported here so jest.mocked() can configure the mock return value in beforeEach.
import { getWalletAccount } from "../../../getWalletAccount";

jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

// ── Mock: ZCash client module (lazy import in index.ts) ────────────────────

const mockBuildTransaction = jest.fn();
const mockBuildIronwoodTransaction = jest.fn();
const mockFinalizeTransaction = jest.fn();
const mockBroadcastTransaction = jest.fn();

const mockClient = {
  grpcUrl: "https://zaino.test",
  network: "mainnet",
  getChainTip: jest.fn(),
  findBlockHeight: jest.fn(),
  estimatedSyncTime: jest.fn(),
  syncShielded: jest.fn(),
  buildTransaction: mockBuildTransaction,
  buildIronwoodTransaction: mockBuildIronwoodTransaction,
  finalizeTransaction: mockFinalizeTransaction,
  broadcastTransaction: mockBroadcastTransaction,
};

const mockCreateZCashClient = jest.fn().mockReturnValue(mockClient);

jest.mock("@ledgerhq/coin-bitcoin/chain-adapters/zcash/ZCash", () => ({
  createZCashClient: mockCreateZCashClient,
}));

// ── Mock: DmkSignerZcash (createSigner augmentation) ──────────────────────

jest.mock("@ledgerhq/live-signer-zcash", () => ({
  DmkSignerZcash: jest.fn().mockImplementation(() => ({
    getAddress: jest.fn(),
    getFullViewingKey: jest.fn(),
    createPaymentTransaction: jest.fn(),
    signPcztTransaction: jest.fn(),
  })),
}));

// ── Mock: wallet-btc (getWalletAccount, for mapTransparentInputs) ──────────
// The factory must NOT reference outer const variables: jest.mock() is hoisted
// above variable declarations, so any outer ref would hit the TDZ. The actual
// mock return value is configured in beforeEach via jest.mocked(getWalletAccount).

jest.mock("../../../getWalletAccount", () => ({
  getWalletAccount: jest.fn(),
}));

// Inner mock functions for the wallet account — declared after the jest.mock
// factory so they are safe to reference in test bodies and beforeEach.
const mockGetAccountAddresses = jest.fn();
const mockGetPubkeyAt = jest.fn();
const mockToOutputScript = jest.fn();

// Load the adapter (side-effect registers it under 'zcash')
import "../index";
import { getChainAdapter } from "../../registry";
import type { ZcashAccount, ZcashTransaction, SpendableNote } from "../types";

// ── Helpers ────────────────────────────────────────────────────────────────

const adapter = getChainAdapter("zcash");
const currency = getCryptoCurrencyById("zcash");

const MOCK_TXID = "aa".repeat(32);
const MOCK_TX_HEX = "05" + "00".repeat(63);
const MOCK_PCZT_HEX = "pczt" + "00".repeat(30);
const MOCK_UFVK = "uview1testkey";
const MOCK_DEVICE_ID = "device-mock";
const MOCK_DERIVATION_PATH = "m/32'/133'/0'";
const MOCK_ACCOUNT_INDEX = 0;

const defaultBuildResult = {
  pcztHex: MOCK_PCZT_HEX,
  pcztTransaction: {
    global: {
      txVersion: 5,
      versionGroupId: 0,
      consensusBranchId: 0,
      fallbackLockTime: null,
      expiryHeight: 0,
      coinType: 133,
      txModifiable: 0,
    },
    transparentInputs: [] as unknown[],
    transparentOutputs: [] as unknown[],
    orchardBundle: null,
  },
  feeZat: "5000",
  anchorHeight: 3000000,
  nActionsOrchard: 2,
  nTransparentInputs: 0,
  nTransparentOutputs: 0,
};

const defaultIronwoodBuildResult = {
  pcztHex: MOCK_PCZT_HEX,
  pcztTransaction: {
    global: {
      txVersion: 6,
      versionGroupId: 0,
      consensusBranchId: 0,
      fallbackLockTime: null,
      expiryHeight: 0,
      coinType: 133,
      txModifiable: 0,
    },
    transparentInputs: [] as unknown[],
    transparentOutputs: [] as unknown[],
    orchardBundle: null,
  },
  feeZat: "5000",
  anchorHeight: 3000000,
  nActionsIronwood: 2,
  nTransparentInputs: 0,
  nTransparentOutputs: 0,
};

const defaultFinalizeResult = { txHex: MOCK_TX_HEX, txid: MOCK_TXID };

// Explicitly typed to allow non-empty Uint8Array[] in per-test overrides.
const defaultSigResult: {
  orchard: Array<{ spendAuthSig: Uint8Array }>;
  transparentInputSigs: Uint8Array[];
} = {
  orchard: [
    { spendAuthSig: new Uint8Array(64).fill(0xab) },
    { spendAuthSig: new Uint8Array(64).fill(0xcd) },
  ],
  transparentInputSigs: [],
};

function makeSpendableNote(overrides: Partial<SpendableNote> = {}): SpendableNote {
  return {
    txid: "tx1",
    outputIndex: 0,
    nullifier: "aa".repeat(32),
    rho: "bb".repeat(32),
    rseed: "cc".repeat(32),
    cmx: "dd".repeat(32),
    position: "42",
    recipient: "ee".repeat(43),
    amount: new BigNumber(200_000),
    ...overrides,
  };
}

function makeAccount(overrides: Partial<ZcashAccount> = {}): ZcashAccount {
  return {
    type: "Account",
    id: "zcash:v2:account:test",
    seedIdentifier: "seed1",
    xpub: "xpub1",
    derivationMode: "",
    index: 0,
    freshAddress: "t1abc",
    freshAddressPath: MOCK_DERIVATION_PATH,
    name: "Zcash Test",
    starred: false,
    used: true,
    balance: new BigNumber(1_000_000),
    spendableBalance: new BigNumber(1_000_000),
    creationDate: new Date(),
    blockHeight: 3_000_000,
    currency,
    unit: currency.units[0],
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    bitcoinResources: { utxos: [] },
    privateInfo: {
      saplingBalance: new BigNumber(0),
      orchardBalance: new BigNumber(1_000_000),
      ironwoodBalance: new BigNumber(0),
      syncState: "complete",
      progress: 100,
      estimatedTimeRemaining: { hours: 0, minutes: 0 },
      ufvk: MOCK_UFVK,
      birthday: "2024-01-01",
      lastSyncTimestamp: Date.now(),
      lastProcessedBlock: 3_000_000,
      transactions: [],
    },
    ...overrides,
  } as unknown as ZcashAccount;
}

function makeTx(
  transferType: ZcashTransaction["transferType"],
  overrides: Partial<ZcashTransaction> = {},
): ZcashTransaction {
  return {
    family: "bitcoin" as const,
    amount: new BigNumber(100_000),
    recipient: "u1recipientaddress",
    useAllAmount: false,
    feePerByte: null,
    networkInfo: null,
    utxoStrategy: { strategy: 0, excludeUTXOs: [] },
    rbf: false,
    transferType,
    selectedNotes: [makeSpendableNote()],
    zcashFee: new BigNumber(5000),
    ...overrides,
  } as ZcashTransaction;
}

type SigResult = typeof defaultSigResult;

function makeSignerContext(sigResult: SigResult = defaultSigResult): jest.Mock {
  return jest.fn(
    (_deviceId: string, _currency: unknown, fn: (signer: unknown) => Promise<unknown>) => {
      const fakeSigner = {
        signPcztTransaction: jest.fn().mockResolvedValue(sigResult),
      };
      return fn(fakeSigner);
    },
  );
}

function callSignOperation(
  account: Account,
  tx: ZcashTransaction,
  signerContext: jest.Mock,
): ReturnType<NonNullable<typeof adapter.signOperation>> {
  return adapter.signOperation!(
    account,
    MOCK_DEVICE_ID,
    tx as unknown as Transaction,
    signerContext as unknown as SignerContext,
  );
}

function collectEvents(
  account: Account,
  tx: ZcashTransaction,
  signerContext: jest.Mock,
): Promise<SignOperationEvent[]> {
  const obs = callSignOperation(account, tx, signerContext);
  if (!obs) throw new Error("signOperation returned undefined unexpectedly");
  return firstValueFrom(obs.pipe(toArray()));
}

// ── Before each ───────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Routing is flag-driven; these orchestration tests all exercise the shielded
  // PCZT path, so enable the flag. Reset in afterEach so it never leaks.
  setZcashShieldedEnabled(true);
  mockBuildTransaction.mockResolvedValue(defaultBuildResult);
  mockBuildIronwoodTransaction.mockResolvedValue(defaultIronwoodBuildResult);
  mockFinalizeTransaction.mockResolvedValue(defaultFinalizeResult);
  mockBroadcastTransaction.mockResolvedValue(MOCK_TXID);
  mockCreateZCashClient.mockReturnValue(mockClient);
  // Wire the wallet-btc mock return value after clearAllMocks() so every test
  // starts with a consistent wallet stub (tests that need custom behavior
  // override these per-mock inside their body).
  jest.mocked(getWalletAccount).mockReturnValue({
    // signOperation reads params.index to resolve the ZIP-32 account index.
    params: { index: MOCK_ACCOUNT_INDEX },
    xpub: {
      xpub: "xpubTestValue",
      getAccountAddresses: mockGetAccountAddresses,
      crypto: {
        getPubkeyAt: mockGetPubkeyAt,
        toOutputScript: mockToOutputScript,
      },
    },
  } as unknown as ReturnType<typeof getWalletAccount>);
});

afterEach(() => {
  setZcashShieldedEnabled(false);
});

// ── Suite 1: Orchestration flow ────────────────────────────────────────────

describe("signOperation — orchestration flow", () => {
  it("returns undefined for transparent transfer types when the flag is OFF (Bitcoin legacy fallback)", () => {
    setZcashShieldedEnabled(false);
    const account = makeAccount();
    const signerContext = makeSignerContext();
    for (const transferType of ["transparent", "transparent-to-shielded"] as const) {
      expect(callSignOperation(account, makeTx(transferType), signerContext)).toBeUndefined();
    }
  });

  it("returns an error Observable for shielded-input types when the flag is OFF", async () => {
    // The legacy transparent path cannot represent note spends at all: it would
    // strip the shielded bundle, compute a wrong ZIP-244 txid, and the network
    // would reject with "Missing inputs". Fail early with a clear error.
    setZcashShieldedEnabled(false);
    const account = makeAccount();
    const signerContext = makeSignerContext();
    for (const transferType of ["shielded", "shielded-to-transparent"] as const) {
      const obs = callSignOperation(account, makeTx(transferType), signerContext);
      expect(obs).toBeInstanceOf(Observable);
      await expect(lastValueFrom(obs!)).rejects.toThrow(
        `Zcash ${transferType} transactions require the zcashShielded feature to be enabled`,
      );
    }
  });

  it("returns an Observable for transferType 'transparent' when the flag is ON (t→t via PCZT)", () => {
    // Contract: with the flag on, even Public→Public routes through PCZT.
    const result = callSignOperation(makeAccount(), makeTx("transparent"), makeSignerContext());
    expect(result).toBeInstanceOf(Observable);
  });

  it("Private→Private: emits device-signature-requested, device-signature-granted, signed in order", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded");
    const signerContext = makeSignerContext();

    const events = await collectEvents(account, tx, signerContext);

    expect(events.map(e => e.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);

    const signedEvent = events.find(e => e.type === "signed")!;
    expect(signedEvent.type).toBe("signed");
    if (signedEvent.type === "signed") {
      expect(signedEvent.signedOperation.operation.hash).toBe(MOCK_TXID);
      expect(signedEvent.signedOperation.signature).toBe(MOCK_TX_HEX);
      expect(signedEvent.signedOperation.operation.type).toBe("OUT");
    }
  });

  it("Private→Public (shielded-to-transparent): emits signed event", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded-to-transparent", { recipient: "t1transparentrecipient" });
    const signerContext = makeSignerContext({
      orchard: [{ spendAuthSig: new Uint8Array(64).fill(0x01) }],
      transparentInputSigs: [],
    });

    const events = await collectEvents(account, tx, signerContext);
    expect(events.map(e => e.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
  });

  it("Public→Private (transparent-to-shielded): reverses txid bytes for TransparentInputJs", async () => {
    const utxoHash = "a1b2c3d4" + "00".repeat(28); // big-endian display order
    const expectedLEtxid = Buffer.from(utxoHash, "hex").reverse().toString("hex");

    const utxo = {
      hash: utxoHash,
      outputIndex: 0,
      blockHeight: 1000,
      address: "t1utxoaddress",
      value: new BigNumber(500_000),
      rbf: false,
      isChange: false,
    };

    mockGetAccountAddresses.mockResolvedValue([{ account: 0, index: 0, address: "t1utxoaddress" }]);
    mockGetPubkeyAt.mockResolvedValue(Buffer.from("02" + "aa".repeat(32), "hex"));
    mockToOutputScript.mockReturnValue(Buffer.from("76a914" + "bb".repeat(20) + "88ac", "hex"));

    const account = makeAccount();
    const tx = makeTx("transparent-to-shielded", {
      selectedNotes: [],
      selectedUtxos: [utxo],
    });

    const signerContext = makeSignerContext({
      orchard: [],
      transparentInputSigs: [new Uint8Array(71).fill(0x30)],
    });

    await collectEvents(account, tx, signerContext);

    // transparent-to-shielded shields into the Ironwood pool, so it builds via
    // the V6 buildIronwoodTransaction.
    const buildCall = mockBuildIronwoodTransaction.mock.calls[0][0];
    expect(buildCall.transparentInputs).toHaveLength(1);
    expect(buildCall.transparentInputs[0].txid).toBe(expectedLEtxid);
    expect(buildCall.transparentInputs[0].vout).toBe(0);
  });

  it("buildIronwoodTransaction is called with the correct spends, fee, and network", async () => {
    const account = makeAccount();
    const note = makeSpendableNote({ amount: new BigNumber(300_000) });
    const tx = makeTx("shielded", {
      selectedNotes: [note],
      zcashFee: new BigNumber(10_000),
      amount: new BigNumber(290_000),
    });
    const signerContext = makeSignerContext();

    await collectEvents(account, tx, signerContext);

    // Shielded sends spend the Ironwood pool ⇒ V6 builder.
    expect(mockBuildIronwoodTransaction).toHaveBeenCalledTimes(1);
    expect(mockBuildTransaction).not.toHaveBeenCalled();
    const args = mockBuildIronwoodTransaction.mock.calls[0][0];
    expect(args.ufvk).toBe(MOCK_UFVK);
    expect(args.feeZat).toBe("10000");
    expect(args.network).toBe("mainnet");
    expect(args.accountIndex).toBe(MOCK_ACCOUNT_INDEX); // resolved from getWalletAccount().params.index
    expect(args.seedFingerprint).toBe("00".repeat(32));
    expect(args.spends).toHaveLength(1);
    expect(args.spends[0].valueZat).toBe("300000");
    expect(args.outputs[0].address).toBe("u1recipientaddress");
    expect(args.outputs[0].valueZat).toBe("290000");
  });

  it("signPcztTransaction is called with the pcztTransaction from buildResult", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded");
    const mockSignPczt = jest.fn().mockResolvedValue(defaultSigResult);
    const signerContext = jest.fn(
      (_d: string, _c: unknown, fn: (signer: unknown) => Promise<unknown>) =>
        fn({ signPcztTransaction: mockSignPczt }),
    );

    await collectEvents(account, tx, signerContext as unknown as jest.Mock);

    expect(mockSignPczt).toHaveBeenCalledTimes(1);
    // Shielded flow ⇒ the Ironwood (V6) builder's PCZT reaches the device.
    expect(mockSignPczt).toHaveBeenCalledWith(defaultIronwoodBuildResult.pcztTransaction);
  });

  // Shielded spends and shielded outputs carry the Ironwood bundle the V6 builder
  // requires; only transparent t→t stays on the V5 buildTransaction.
  it.each([
    ["shielded", true],
    ["shielded-to-transparent", true],
    ["transparent-to-shielded", true],
    ["transparent", false],
  ] as const)(
    "routes %s through the correct PCZT builder",
    async (transferType, usesIronwoodBuilder) => {
      const account = makeAccount();
      const tx = makeTx(transferType, { recipient: "t1transparentrecipient" });
      const signerContext = makeSignerContext();

      const events = await collectEvents(account, tx, signerContext);
      expect(events.map(e => e.type)).toEqual([
        "device-signature-requested",
        "device-signature-granted",
        "signed",
      ]);
      if (usesIronwoodBuilder) {
        expect(mockBuildIronwoodTransaction).toHaveBeenCalledTimes(1);
        expect(mockBuildTransaction).not.toHaveBeenCalled();
      } else {
        expect(mockBuildTransaction).toHaveBeenCalledTimes(1);
        expect(mockBuildIronwoodTransaction).not.toHaveBeenCalled();
      }
    },
  );
});

// ── Suite 2: Signature mapping ─────────────────────────────────────────────

describe("signOperation — signature mapping", () => {
  it("maps SpendableNote fields to OrchardSpendInputJs correctly", async () => {
    const note = makeSpendableNote({
      recipient: "ee".repeat(43),
      rho: "11".repeat(32),
      rseed: "22".repeat(32),
      cmx: "33".repeat(32),
      position: "999",
      amount: new BigNumber(150_000),
    });
    const account = makeAccount();
    const tx = makeTx("shielded", { selectedNotes: [note] });
    const signerContext = makeSignerContext();

    await collectEvents(account, tx, signerContext);

    const args = mockBuildIronwoodTransaction.mock.calls[0][0];
    expect(args.spends[0]).toMatchObject({
      recipient: "ee".repeat(43),
      rho: "11".repeat(32),
      rseed: "22".repeat(32),
      cmx: "33".repeat(32),
      position: "999",
      valueZat: "150000",
    });
  });

  it("maps transaction amount and recipient into outputs; includes memo when present", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded", {
      amount: new BigNumber(77_000),
      recipient: "u1memotest",
      memo: "hello shielded",
    });
    const signerContext = makeSignerContext();

    await collectEvents(account, tx, signerContext);

    const args = mockBuildIronwoodTransaction.mock.calls[0][0];
    expect(args.outputs).toHaveLength(1);
    expect(args.outputs[0]).toEqual({
      address: "u1memotest",
      valueZat: "77000",
      memo: "hello shielded",
    });
  });

  it("omits memo from outputs when not present on transaction", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded", { amount: new BigNumber(50_000) });
    const signerContext = makeSignerContext();

    await collectEvents(account, tx, signerContext);

    const args = mockBuildIronwoodTransaction.mock.calls[0][0];
    expect(args.outputs[0]).not.toHaveProperty("memo");
  });

  it("encodes Orchard spendAuthSig as 128-char hex string to finalizeTransaction", async () => {
    const sig64bytes = new Uint8Array(64).fill(0xde);
    const expectedHex = Buffer.from(sig64bytes).toString("hex");
    expect(expectedHex).toHaveLength(128);

    const account = makeAccount();
    const tx = makeTx("shielded");
    const signerContext = makeSignerContext({
      orchard: [{ spendAuthSig: sig64bytes }],
      transparentInputSigs: [],
    });

    await collectEvents(account, tx, signerContext);

    const finalizeArgs = mockFinalizeTransaction.mock.calls[0][0];
    expect(finalizeArgs.orchardSignatures).toHaveLength(1);
    expect(finalizeArgs.orchardSignatures[0]).toBe(expectedHex);
  });

  it("passes DER+sighash transparent sig bytes as-is to finalizeTransaction (no pre-stripping)", async () => {
    // The transparent sig includes a trailing 0x01 sighash byte.
    // finalize.rs strips it internally; we must not strip it here.
    const derPlusSighash = new Uint8Array(72);
    derPlusSighash[0] = 0x30; // DER sequence marker
    derPlusSighash[71] = 0x01; // SIGHASH_ALL
    const expectedHex = Buffer.from(derPlusSighash).toString("hex");

    const utxo = {
      hash: "ff".repeat(32),
      outputIndex: 0,
      address: "t1sigtest",
      value: new BigNumber(100_000),
      rbf: false,
      isChange: false,
      blockHeight: null,
    };
    mockGetAccountAddresses.mockResolvedValue([{ account: 0, index: 0, address: "t1sigtest" }]);
    mockGetPubkeyAt.mockResolvedValue(Buffer.from("02" + "aa".repeat(32), "hex"));
    mockToOutputScript.mockReturnValue(Buffer.from("76a914" + "bb".repeat(20) + "88ac", "hex"));

    const account = makeAccount();
    const tx = makeTx("transparent-to-shielded", {
      selectedNotes: [],
      selectedUtxos: [utxo],
    });
    const signerContext = makeSignerContext({
      orchard: [],
      transparentInputSigs: [derPlusSighash],
    });

    await collectEvents(account, tx, signerContext);

    const finalizeArgs = mockFinalizeTransaction.mock.calls[0][0];
    expect(finalizeArgs.transparentSignatures[0]).toBe(expectedHex);
  });
});

// ── Suite 3: Error handling ────────────────────────────────────────────────

describe("signOperation — error handling", () => {
  it("surfaces error when ufvk is missing from privateInfo", async () => {
    const account = makeAccount({
      privateInfo: {
        saplingBalance: new BigNumber(0),
        orchardBalance: new BigNumber(0),
        ironwoodBalance: new BigNumber(0),
        syncState: "disabled",
        progress: 0,
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
        ufvk: null,
        birthday: null,
        lastSyncTimestamp: null,
        lastProcessedBlock: null,
        transactions: [],
      },
    });
    const tx = makeTx("shielded");
    const signerContext = makeSignerContext();

    const obs = callSignOperation(account, tx, signerContext) as Observable<SignOperationEvent>;
    await expect(lastValueFrom(obs)).rejects.toThrow(/Missing UFVK/);
  });

  it("surfaces error when selectedNotes is missing", async () => {
    const account = makeAccount();
    // exactOptionalPropertyTypes requires a cast to pass explicit undefined
    const tx = makeTx("shielded", {
      selectedNotes: undefined,
    } as unknown as Partial<ZcashTransaction>);
    const signerContext = makeSignerContext();

    const obs = callSignOperation(account, tx, signerContext) as Observable<SignOperationEvent>;
    await expect(lastValueFrom(obs)).rejects.toThrow(/Missing selectedNotes/);
  });

  it("surfaces error when zcashFee is missing", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded", { zcashFee: undefined } as unknown as Partial<ZcashTransaction>);
    const signerContext = makeSignerContext();

    const obs = callSignOperation(account, tx, signerContext) as Observable<SignOperationEvent>;
    await expect(lastValueFrom(obs)).rejects.toThrow(/Missing zcashFee/);
  });

  // Captures the error an errored observable rejects with, failing if it instead
  // completes. Lets each test assert on the *identity* and type of the surfaced
  // error, proving the orchestration propagates it unchanged (no re-wrap /
  // stringify) rather than only matching a substring of its message.
  async function captureObservableError(obs: Observable<SignOperationEvent>): Promise<unknown> {
    return lastValueFrom(obs).then(
      () => {
        throw new Error("expected the observable to error, but it completed");
      },
      (err: unknown) => err,
    );
  }

  it("surfaces a device rejection as the same typed UserRefusedOnDevice instance (not re-wrapped)", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded");
    // The real DmkSignerZcash.mapError maps device errorCode 6985 to a
    // UserRefusedOnDevice instance (@ledgerhq/ledger-wallet-framework/errors). Reject with that concrete
    // type — a generic Error whose message is the string "UserRefusedOnDevice"
    // would pass a substring assertion even if the orchestration stringified or
    // re-wrapped the typed error.
    const rejection = new UserRefusedOnDevice();
    const signerContext = jest.fn().mockRejectedValue(rejection);

    const caught = await captureObservableError(
      callSignOperation(account, tx, signerContext as unknown as jest.Mock)!,
    );

    expect(caught).toBeInstanceOf(UserRefusedOnDevice);
    expect((caught as Error).name).toBe("UserRefusedOnDevice");
    expect(caught).toBe(rejection);
  });

  it("surfaces a network rejection from buildIronwoodTransaction unchanged and never reaches device signing", async () => {
    class ZainoNetworkError extends Error {
      override name = "ZainoNetworkError";
    }
    const rejection = new ZainoNetworkError("zaino gRPC endpoint unreachable");
    mockBuildIronwoodTransaction.mockRejectedValueOnce(rejection);
    const signerContext = makeSignerContext();

    const caught = await captureObservableError(
      callSignOperation(makeAccount(), makeTx("shielded"), signerContext)!,
    );

    expect(caught).toBe(rejection);
    expect((caught as Error).name).toBe("ZainoNetworkError");
    // Build failed before the device was ever asked to sign / finalize.
    expect(signerContext).not.toHaveBeenCalled();
    expect(mockFinalizeTransaction).not.toHaveBeenCalled();
  });

  it("surfaces a witness/proof failure from finalizeTransaction unchanged", async () => {
    class WitnessInjectionError extends Error {
      override name = "WitnessInjectionError";
    }
    const rejection = new WitnessInjectionError("orchard spendAuthSig does not verify");
    mockFinalizeTransaction.mockRejectedValueOnce(rejection);
    const signerContext = makeSignerContext();

    const caught = await captureObservableError(
      callSignOperation(makeAccount(), makeTx("shielded"), signerContext)!,
    );

    expect(caught).toBe(rejection);
    expect((caught as Error).name).toBe("WitnessInjectionError");
  });

  it("fails closed with ZcashUtxoNotInAccount when a spent transparent UTXO has no address", async () => {
    mockGetAccountAddresses.mockResolvedValue([{ account: 0, index: 0, address: "t1known" }]);
    const utxo = {
      hash: "ab".repeat(32),
      outputIndex: 3,
      blockHeight: 1000,
      address: "", // missing address — cannot be mapped to a signing key
      value: new BigNumber(500_000),
      rbf: false,
      isChange: false,
    };
    const tx = makeTx("transparent-to-shielded", { selectedNotes: [], selectedUtxos: [utxo] });

    const caught = await captureObservableError(
      callSignOperation(makeAccount(), tx, makeSignerContext())!,
    );

    expect(caught).toBeInstanceOf(ZcashUtxoNotInAccount);
    expect((caught as Error).name).toBe("ZcashUtxoNotInAccount");
    // Keeps txid/vout for support logs, but never leaks an address in the message.
    expect(caught).toMatchObject({ txid: utxo.hash, vout: 3 });
    expect((caught as Error).message).not.toContain(utxo.hash);
    // Fails before the PCZT is ever built.
    expect(mockBuildIronwoodTransaction).not.toHaveBeenCalled();
  });

  it("fails closed with ZcashUtxoNotInAccount when a transparent UTXO address is outside the synced set (gap limit / stale sync)", async () => {
    // Only "t1known" is within the fetched receive/change addresses; the UTXO's
    // address is not (e.g. an out-of-gap-limit or stale-sync coin).
    mockGetAccountAddresses.mockResolvedValue([{ account: 0, index: 0, address: "t1known" }]);
    const utxo = {
      hash: "cd".repeat(32),
      outputIndex: 1,
      blockHeight: 1000,
      address: "t1outOfGapLimit",
      value: new BigNumber(500_000),
      rbf: false,
      isChange: false,
    };
    const tx = makeTx("transparent-to-shielded", { selectedNotes: [], selectedUtxos: [utxo] });

    const caught = await captureObservableError(
      callSignOperation(makeAccount(), tx, makeSignerContext())!,
    );

    expect(caught).toBeInstanceOf(ZcashUtxoNotInAccount);
    expect((caught as Error).name).toBe("ZcashUtxoNotInAccount");
    expect(caught).toMatchObject({ txid: utxo.hash, vout: 1 });
    // The raw address must not leak into the user-facing message.
    expect((caught as Error).message).not.toContain("t1outOfGapLimit");
    expect(mockBuildIronwoodTransaction).not.toHaveBeenCalled();
  });

  it("does NOT broadcast during signOperation (broadcast happens in the broadcast step)", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded");
    const signerContext = makeSignerContext();

    await collectEvents(account, tx, signerContext);

    expect(mockBroadcastTransaction).not.toHaveBeenCalled();
  });

  it("marks the signed operation as shielded so the broadcast step can route it", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded");
    const signerContext = makeSignerContext();

    const events = await collectEvents(account, tx, signerContext);
    const signedEvent = events.find(e => e.type === "signed")!;
    if (signedEvent.type === "signed") {
      expect(signedEvent.signedOperation.operation.extra).toMatchObject({ zcashShielded: true });
    }
  });

  it("carries transparent inputs/inputRefs metadata for Public→* flows (double-spend guard + conflict-dedup)", async () => {
    const utxoHash = "a1b2c3d4" + "00".repeat(28); // big-endian display order
    const utxo = {
      hash: utxoHash,
      outputIndex: 2,
      blockHeight: 1000,
      address: "t1utxoaddress",
      value: new BigNumber(500_000),
      rbf: false,
      isChange: false,
    };

    mockGetAccountAddresses.mockResolvedValue([{ account: 0, index: 0, address: "t1utxoaddress" }]);
    mockGetPubkeyAt.mockResolvedValue(Buffer.from("02" + "aa".repeat(32), "hex"));
    mockToOutputScript.mockReturnValue(Buffer.from("76a914" + "bb".repeat(20) + "88ac", "hex"));

    const account = makeAccount();
    const tx = makeTx("transparent-to-shielded", { selectedNotes: [], selectedUtxos: [utxo] });
    const signerContext = makeSignerContext({
      orchard: [],
      transparentInputSigs: [new Uint8Array(71).fill(0x30)],
    });

    const events = await collectEvents(account, tx, signerContext);
    const signedEvent = events.find(e => e.type === "signed")!;
    if (signedEvent.type === "signed") {
      // Marker preserved (routes to the gRPC broadcast override) AND the
      // transparent UTXO metadata is present so the standard double-spend guard
      // and pending-spent/conflict-dedup consumers keep working.
      expect(signedEvent.signedOperation.operation.extra).toMatchObject({
        zcashShielded: true,
        inputRefs: [{ hash: utxoHash, outputIndex: 2, address: "t1utxoaddress" }],
        inputs: [`${utxoHash}-2`],
      });
    }
  });

  it("omits inputs/inputRefs for pure shielded flows (no transparent UTXOs spent)", async () => {
    const account = makeAccount(); // bitcoinResources.utxos is [] by default
    const tx = makeTx("shielded");
    const signerContext = makeSignerContext();

    const events = await collectEvents(account, tx, signerContext);
    const signedEvent = events.find(e => e.type === "signed")!;
    if (signedEvent.type === "signed") {
      const extra = signedEvent.signedOperation.operation.extra as Record<string, unknown>;
      expect(extra).toMatchObject({ zcashShielded: true });
      expect(extra).not.toHaveProperty("inputRefs");
      expect(extra).not.toHaveProperty("inputs");
    }
  });

  it("does NOT spend the account's transparent UTXOs on an Ironwood-only shielded send", async () => {
    // Regression: a "shielded" (private→private) send spends Ironwood notes and
    // must never pull in the account's transparent UTXOs even when some exist.
    // Only transfer types that actually spend transparent inputs
    // (transparent-to-shielded) should.
    const utxo = {
      hash: "cc".repeat(32),
      outputIndex: 1,
      blockHeight: 1000,
      address: "t1shouldNotBeSpent",
      value: new BigNumber(500_000),
      rbf: false,
      isChange: false,
    };
    const account = makeAccount({ bitcoinResources: { utxos: [utxo] } } as Partial<ZcashAccount>);
    const tx = makeTx("shielded");
    const signerContext = makeSignerContext();

    const events = await collectEvents(account, tx, signerContext);

    // No transparent inputs mapped into the PCZT builder call...
    const buildCall = mockBuildIronwoodTransaction.mock.calls[0][0];
    expect(buildCall.transparentInputs).toHaveLength(0);

    // ...and none leaked into the optimistic operation's inputs/inputRefs.
    const signedEvent = events.find(e => e.type === "signed")!;
    if (signedEvent.type === "signed") {
      const extra = signedEvent.signedOperation.operation.extra as Record<string, unknown>;
      expect(extra).not.toHaveProperty("inputRefs");
      expect(extra).not.toHaveProperty("inputs");
    }
  });

  it("does NOT spend the account's transparent UTXOs on a shielded-to-transparent send", async () => {
    // Same guard for private→public sends: inputs are Ironwood notes, so the
    // account's transparent UTXOs must not be spent.
    const utxo = {
      hash: "dd".repeat(32),
      outputIndex: 0,
      blockHeight: 1000,
      address: "t1shouldNotBeSpent",
      value: new BigNumber(500_000),
      rbf: false,
      isChange: false,
    };
    const account = makeAccount({ bitcoinResources: { utxos: [utxo] } } as Partial<ZcashAccount>);
    const tx = makeTx("shielded-to-transparent", { recipient: "t1transparentrecipient" });
    const signerContext = makeSignerContext({
      orchard: [{ spendAuthSig: new Uint8Array(64).fill(0x01) }],
      transparentInputSigs: [],
    });

    const events = await collectEvents(account, tx, signerContext);

    const buildCall = mockBuildIronwoodTransaction.mock.calls[0][0];
    expect(buildCall.transparentInputs).toHaveLength(0);

    const signedEvent = events.find(e => e.type === "signed")!;
    if (signedEvent.type === "signed") {
      const extra = signedEvent.signedOperation.operation.extra as Record<string, unknown>;
      expect(extra).not.toHaveProperty("inputRefs");
      expect(extra).not.toHaveProperty("inputs");
    }
  });
});

// ── Suite 3b: Broadcast override ───────────────────────────────────────────

describe("broadcast — shielded gRPC submission", () => {
  function makeSignedOperation(overrides: { extra?: unknown; signature?: string } = {}) {
    return {
      operation: {
        id: "zcash:v2:account:test-aabb-OUT",
        hash: MOCK_TXID,
        type: "OUT" as const,
        value: new BigNumber(105_000),
        fee: new BigNumber(5000),
        blockHash: null,
        blockHeight: null,
        senders: ["t1abc"],
        recipients: ["u1recipientaddress"],
        accountId: "zcash:v2:account:test",
        date: new Date(),
        extra: "extra" in overrides ? overrides.extra : { zcashShielded: true },
      },
      signature: overrides.signature ?? MOCK_TX_HEX,
    } as unknown as Parameters<NonNullable<typeof adapter.broadcast>>[1];
  }

  it("broadcasts the signed V5 tx hex over gRPC and returns the patched operation", async () => {
    const account = makeAccount();
    const result = (await adapter.broadcast!(account, makeSignedOperation()))!;

    expect(mockBroadcastTransaction).toHaveBeenCalledTimes(1);
    expect(mockBroadcastTransaction).toHaveBeenCalledWith(expect.any(String), MOCK_TX_HEX);
    expect(result.hash).toBe(MOCK_TXID);
  });

  it("returns undefined for a non-shielded operation (falls through to explorer broadcast)", () => {
    const account = makeAccount();
    const result = adapter.broadcast!(account, makeSignedOperation({ extra: {} }));
    expect(result).toBeUndefined();
    expect(mockBroadcastTransaction).not.toHaveBeenCalled();
  });

  it("surfaces broadcastTransaction failure", async () => {
    mockBroadcastTransaction.mockRejectedValueOnce(new Error("network rejected tx"));
    const account = makeAccount();

    await expect(adapter.broadcast!(account, makeSignedOperation())).rejects.toThrow(
      "network rejected tx",
    );
  });

  it("throws when the resolved client cannot broadcast (unsupported environment)", async () => {
    mockCreateZCashClient.mockReturnValueOnce({ ...mockClient, broadcastTransaction: undefined });
    const account = makeAccount();

    await expect(adapter.broadcast!(account, makeSignedOperation())).rejects.toThrow(
      /not supported in this environment/,
    );
  });
});

// ── Suite 4: Cancellation ──────────────────────────────────────────────────

describe("signOperation — cancellation", () => {
  // These tests assert on the *downstream production mocks* (device signing,
  // finalize, broadcast) rather than only on the absence of a `signed` event.
  // A `signed` event is impossible to observe after `unsubscribe()` regardless
  // of the production guards (RxJS never calls `next` on a closed subscriber),
  // so an event-only assertion can never fail. The guards' real job is to stop
  // the flow *before the next step* — that is what these mocks verify.

  const drain = (ms = 20) => new Promise(r => setTimeout(r, ms));

  it("cancel while buildTransaction is in-flight ⇒ device signing and finalize are never reached", async () => {
    let buildResolve!: (v: typeof defaultIronwoodBuildResult) => void;
    // Shielded sends build via the Ironwood (V6) builder; block that promise.
    mockBuildIronwoodTransaction.mockReturnValueOnce(
      new Promise(res => {
        buildResolve = res;
      }),
    );

    const account = makeAccount();
    const tx = makeTx("shielded");
    const signerContext = makeSignerContext();
    const events: SignOperationEvent[] = [];

    const sub = callSignOperation(account, tx, signerContext)!.subscribe({
      next: e => events.push(e),
    });

    // Cancel while the PCZT build promise is still pending, then let it resolve.
    sub.unsubscribe();
    buildResolve(defaultIronwoodBuildResult);
    await drain();

    // The guard after buildTransaction stops the flow: the device is never asked
    // to sign and finalize is never called. Removing that guard would fire both.
    expect(signerContext).not.toHaveBeenCalled();
    expect(mockFinalizeTransaction).not.toHaveBeenCalled();
    expect(events.some(e => e.type === "signed")).toBe(false);
  });

  it("cancel while the device is signing ⇒ finalize is never reached", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded");
    const events: SignOperationEvent[] = [];
    let sub: import("rxjs").Subscription | undefined;

    // Cancel right as device signing resolves, before the finalize step.
    const signerContext = jest.fn(
      (_d: string, _c: unknown, fn: (signer: unknown) => Promise<unknown>) => {
        Promise.resolve().then(() => sub?.unsubscribe());
        return fn({ signPcztTransaction: jest.fn().mockResolvedValue(defaultSigResult) });
      },
    );

    sub = callSignOperation(account, tx, signerContext as unknown as jest.Mock)!.subscribe({
      next: e => events.push(e),
    });
    await drain();

    // The guard after device signature grant stops the flow before finalize.
    expect(mockFinalizeTransaction).not.toHaveBeenCalled();
    expect(mockBroadcastTransaction).not.toHaveBeenCalled();
    expect(events.some(e => e.type === "signed")).toBe(false);
  });

  it("cancel while finalizeTransaction is in-flight ⇒ no signed event and nothing is broadcast", async () => {
    // 3rd checkpoint: cancel after finalize is entered but before the signed
    // event. finalize is reached (the stage ran) but the guard after it prevents
    // the signed event, so the consumer never receives a signature to broadcast.
    let finalizeResolve!: (v: typeof defaultFinalizeResult) => void;
    mockFinalizeTransaction.mockReturnValueOnce(
      new Promise(res => {
        finalizeResolve = res;
      }),
    );

    const account = makeAccount();
    const tx = makeTx("shielded");
    const events: SignOperationEvent[] = [];

    const sub = callSignOperation(account, tx, makeSignerContext())!.subscribe({
      next: e => events.push(e),
    });

    // Let the flow advance to (and block on) finalize, then cancel and resolve.
    await drain();
    expect(mockFinalizeTransaction).toHaveBeenCalledTimes(1);
    sub.unsubscribe();
    finalizeResolve(defaultFinalizeResult);
    await drain();

    expect(events.some(e => e.type === "signed")).toBe(false);
    expect(mockBroadcastTransaction).not.toHaveBeenCalled();
  });
});

// NOTE: the build/finalize/broadcast IPC-channel contract (channel name + args +
// generated requestId) is owned by ZCashIPC.test.ts. A duplicate suite used to
// live here (importing ZCashIPC via require); it was removed as it added no
// orchestration-layer coverage and doubled the maintenance cost whenever the IPC
// payload shape changes.
