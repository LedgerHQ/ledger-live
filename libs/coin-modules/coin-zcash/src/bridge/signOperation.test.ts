/**
 * Tests for the Zcash PCZT signOperation orchestration -- the only bespoke
 * bridge residue. `logic/transaction/craftTransaction` and
 * `logic/transaction/combine` are mocked so the test never touches the
 * native engine; device interaction is mocked through signerContext.
 */
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { buildSignOperation } from "./signOperation";
import { craftIronwoodTransaction, craftTransaction } from "../logic/transaction/craftTransaction";
import { combine } from "../logic/transaction/combine";
import { assertCanSend } from "../logic/engineClient";
import { getWalletAccount } from "./getWalletAccount";
import {
  getSessionReservedNullifiers,
  releaseRetiredReservations,
  _resetReservationsForTest,
} from "./note-reservation";
import type { SpendableNote } from "../network/types";
import type { SignerContext } from "../types/signer";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { ZcashNotesNotYetSpendable, ZcashShieldedKeyMissing } from "../types/errors";

jest.mock("../logic/transaction/craftTransaction");
jest.mock("../logic/transaction/combine");
jest.mock("../logic/engineClient");
jest.mock("./getWalletAccount");

const mockCraftTransaction = craftTransaction as jest.MockedFunction<typeof craftTransaction>;
const mockCraftIronwoodTransaction = craftIronwoodTransaction as jest.MockedFunction<
  typeof craftIronwoodTransaction
>;
const mockCombine = combine as jest.MockedFunction<typeof combine>;
const mockGetWalletAccount = getWalletAccount as jest.MockedFunction<typeof getWalletAccount>;
const mockAssertCanSend = assertCanSend as jest.MockedFunction<typeof assertCanSend>;

const currency = getCryptoCurrencyById("zcash");

const MOCK_TXID = "aa".repeat(32);
const MOCK_TX_HEX = "05" + "00".repeat(63);
const MOCK_PCZT_HEX = "pczt" + "00".repeat(30);
// Distinct from the v1 PCZT so the tests can tell which builder's output reached
// the device and the finalizer.
const MOCK_PCZT_V2_HEX = "pczt" + "02".repeat(30);
const MOCK_UFVK = "uview1testkey";

// BIP-32 test vector 1 (m/0H) — a real serialized xpub, so the account key
// material extracted from it is checkable against the published vector rather
// than against our own encoder. See `signer/xpub.test.ts`.
const ACCOUNT_XPUB =
  "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw";
const ACCOUNT_CHAIN_CODE_HEX = "47fdacbd0f1097043b78c63c20c34ef4ed9a111d980047ad16282c7ae6236141";
const ACCOUNT_PUBKEY_HEX = "035a784662a4a20a65bf6aab9ae98a6c068a81c52e4b032c0fb5400c706cfccc56";

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
    transparentInputs: [],
    transparentOutputs: [],
    orchardBundle: null,
  },
  feeZat: "5000",
  anchorHeight: 3_000_000,
  nActionsOrchard: 2,
  nTransparentInputs: 0,
  nTransparentOutputs: 0,
} as Awaited<ReturnType<typeof craftTransaction>>;

const defaultIronwoodBuildResult = {
  ...defaultBuildResult,
  pcztHex: MOCK_PCZT_V2_HEX,
  pcztTransaction: {
    ...defaultBuildResult.pcztTransaction,
    global: { ...defaultBuildResult.pcztTransaction.global, txVersion: 6 },
  },
  nActionsIronwood: 2,
} as Awaited<ReturnType<typeof craftIronwoodTransaction>>;

const defaultFinalizeResult = { txHex: MOCK_TX_HEX, txid: MOCK_TXID };

const defaultSigResult = {
  orchard: [
    { spendAuthSig: new Uint8Array(64).fill(0xab) },
    { spendAuthSig: new Uint8Array(64).fill(0xcd) },
  ],
  transparentInputSigs: [] as Uint8Array[],
  // `SignPcztTransactionResult.ironwood` is required and is empty whenever the
  // device signed no Ironwood action.
  ironwood: [] as { spendAuthSig: Uint8Array }[],
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
    id: "zcash:v2:account:test",
    seedIdentifier: "seed1",
    xpub: ACCOUNT_XPUB,
    derivationMode: "",
    index: 0,
    freshAddress: "t1abc",
    freshAddressPath: "m/32'/133'/0'",
    name: "Zcash Test",
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
      shieldedAddress: null,
      lastSyncTimestamp: Date.now(),
      lastProcessedBlock: 3_000_000,
      transactions: [],
    },
    ...overrides,
  } as unknown as ZcashAccount;
}

function makeTx(
  transferType: Transaction["transferType"],
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    family: "zcash",
    amount: new BigNumber(100_000),
    recipient: "u1recipientaddress",
    useAllAmount: false,
    transferType,
    selectedNotes: [makeSpendableNote()],
    zcashFee: new BigNumber(5000),
    ...overrides,
  } as Transaction;
}

function makeSignerContext(sigResult = defaultSigResult): SignerContext {
  return jest.fn(async (_deviceId, fn) =>
    fn({
      getAddress: jest.fn(),
      getFullViewingKey: jest.fn(),
      signPcztTransaction: jest.fn().mockResolvedValue(sigResult),
    }),
  ) as unknown as SignerContext;
}

async function collectEvents(
  signOp: ReturnType<typeof buildSignOperation>,
  args: Parameters<ReturnType<typeof buildSignOperation>>[0],
): Promise<SignOperationEvent[]> {
  return lastValueFrom(signOp(args).pipe(toArray()));
}

describe("bridge/signOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCraftTransaction.mockResolvedValue(defaultBuildResult);
    mockCraftIronwoodTransaction.mockResolvedValue(defaultIronwoodBuildResult);
    mockCombine.mockResolvedValue(defaultFinalizeResult);
    mockAssertCanSend.mockResolvedValue(undefined);
    mockGetWalletAccount.mockReturnValue({
      params: { index: 0 },
    } as unknown as ReturnType<typeof getWalletAccount>);
  });

  // An Ironwood spend or an Ironwood output carries the bundle the V6 builder
  // requires. Shielded sends spend the Ironwood pool ("shielded" /
  // "shielded-to-transparent") and shielding ("transparent-to-shielded") credits
  // it, so all three use the V6 builder; only t→t stays on the v1/V5 builder.
  it.each([
    ["shielded", "z→z", "v6"],
    ["shielded-to-transparent", "z→t", "v6"],
    ["transparent-to-shielded", "t→z", "v6"],
    ["transparent", "t→t", "v1"],
  ] as const)(
    "crafts, signs, finalizes and emits a signed operation (%s / %s, PCZT %s)",
    async (transferType, _label, encoding) => {
      const account = makeAccount();
      const tx = makeTx(transferType);
      const signerContext = makeSignerContext();
      const signOp = buildSignOperation(signerContext);

      const events = await collectEvents(signOp, {
        account,
        deviceId: "device-1",
        transaction: tx,
      } as never);

      expect(events.map(e => e.type)).toEqual([
        "device-signature-requested",
        "device-signature-granted",
        "signed",
      ]);
      const [expectedCraft, unusedCraft, expectedPczt] =
        encoding === "v1"
          ? [mockCraftTransaction, mockCraftIronwoodTransaction, MOCK_PCZT_HEX]
          : [mockCraftIronwoodTransaction, mockCraftTransaction, MOCK_PCZT_V2_HEX];
      expect(expectedCraft).toHaveBeenCalledWith(
        expect.objectContaining({ ufvk: MOCK_UFVK, feeZat: "5000" }),
      );
      expect(unusedCraft).not.toHaveBeenCalled();
      expect(mockCombine).toHaveBeenCalledWith({
        pczt: expectedPczt,
        orchardSignatures: [
          Buffer.from(defaultSigResult.orchard[0].spendAuthSig).toString("hex"),
          Buffer.from(defaultSigResult.orchard[1].spendAuthSig).toString("hex"),
        ],
        transparentSignatures: [],
      });

      const signedEvent = events.find(
        (e): e is Extract<SignOperationEvent, { type: "signed" }> => e.type === "signed",
      );
      expect(signedEvent?.signedOperation).toMatchObject({
        signature: MOCK_TX_HEX,
        operation: { hash: MOCK_TXID, extra: { zcashShielded: true } },
      });
    },
  );

  // A V6 send is only finishable if the device's Ironwood spend-auth signatures
  // reach the finalizer: without them the extracted transaction carries
  // unauthorized spends. The V5 path has always been covered by the cases
  // above; this is the V6 counterpart.
  it("forwards the device's Ironwood signatures to combine for a V6 send", async () => {
    const ironwoodSigs = [
      { spendAuthSig: new Uint8Array(64).fill(0x11) },
      { spendAuthSig: new Uint8Array(64).fill(0x22) },
    ];
    const signOp = buildSignOperation(
      makeSignerContext({ orchard: [], transparentInputSigs: [], ironwood: ironwoodSigs }),
    );

    await collectEvents(signOp, {
      account: makeAccount(),
      deviceId: "device-1",
      transaction: makeTx("shielded"),
    } as never);

    expect(mockCombine).toHaveBeenCalledWith({
      pczt: MOCK_PCZT_V2_HEX,
      orchardSignatures: [],
      transparentSignatures: [],
      ironwoodSignatures: [
        Buffer.from(ironwoodSigs[0].spendAuthSig).toString("hex"),
        Buffer.from(ironwoodSigs[1].spendAuthSig).toString("hex"),
      ],
    });
  });

  // The key is omitted rather than sent empty: zcash-utils treats an absent
  // `ironwoodSignatures` as "no Ironwood bundle to sign", and length-checks the
  // list against the PCZT when it is present.
  //
  // Asserted on the argument's own keys rather than with
  // `expect.not.objectContaining({ ironwoodSignatures: expect.anything() })`:
  // that matcher passes for `ironwoodSignatures: undefined` (`anything()` never
  // matches `undefined`), which is exactly the case the conditional spread
  // exists to avoid, and it constrains none of the keys that must be present.
  it("omits ironwoodSignatures entirely when the device signed no Ironwood action", async () => {
    const signOp = buildSignOperation(makeSignerContext());

    await collectEvents(signOp, {
      account: makeAccount(),
      deviceId: "device-1",
      transaction: makeTx("transparent"),
    } as never);

    expect(mockCombine).toHaveBeenCalledTimes(1);
    const args = mockCombine.mock.calls[0][0];
    expect(Object.keys(args).sort()).toEqual([
      "orchardSignatures",
      "pczt",
      "transparentSignatures",
    ]);
    expect(args).toEqual({
      pczt: MOCK_PCZT_HEX,
      orchardSignatures: [
        Buffer.from(defaultSigResult.orchard[0].spendAuthSig).toString("hex"),
        Buffer.from(defaultSigResult.orchard[1].spendAuthSig).toString("hex"),
      ],
      transparentSignatures: [],
    });
  });

  it("gives up before touching the device when the engine cannot complete a send", async () => {
    // A client that can build but not finalize would otherwise be discovered
    // after the user has signed.
    mockAssertCanSend.mockRejectedValue(
      new Error("Shielded Zcash transactions are not supported in this environment"),
    );
    const signerContext = makeSignerContext();
    const signOp = buildSignOperation(signerContext);

    await expect(
      collectEvents(signOp, {
        account: makeAccount(),
        deviceId: "device-1",
        transaction: makeTx("transparent"),
      } as never),
    ).rejects.toThrow("not supported in this environment");

    expect(signerContext).not.toHaveBeenCalled();
    expect(mockCraftTransaction).not.toHaveBeenCalled();
    expect(mockCraftIronwoodTransaction).not.toHaveBeenCalled();
  });

  // A UFVK only reaches the wallet through the export flow, which the user has
  // to confirm on the device. So it is present for a shielded-enabled account
  // and absent for one that only ever held public funds -- and a t→t send, which
  // reads no shielded key material, must work in both cases.
  // An account represents "no UFVK" in more than one way: no privateInfo at all,
  // or a privateInfo whose ufvk is null or an empty string -- which is why the
  // shielded scan gates on its length as well (`sync.ts`'s `ufvkIsPresent`).
  // Every one of them must behave identically here.
  describe.each([
    [
      "no privateInfo",
      () => {
        const account = makeAccount();
        delete (account as { privateInfo?: unknown }).privateInfo;
        return account;
      },
    ],
    [
      "a null ufvk",
      () => makeAccount({ privateInfo: { ...makeAccount().privateInfo, ufvk: null } } as never),
    ],
    [
      "an empty ufvk",
      () => makeAccount({ privateInfo: { ...makeAccount().privateInfo, ufvk: "" } } as never),
    ],
  ] as const)("an account with %s", (_label, accountWithoutUfvk) => {
    it.each(["shielded", "shielded-to-transparent", "transparent-to-shielded"] as const)(
      "refuses a %s send, which cannot be built without the shielded keys",
      async transferType => {
        const signOp = buildSignOperation(makeSignerContext());

        await expect(
          lastValueFrom(
            signOp({
              account: accountWithoutUfvk(),
              deviceId: "device-1",
              transaction: makeTx(transferType),
            } as never),
          ),
        ).rejects.toThrow(ZcashShieldedKeyMissing);
        expect(mockCraftIronwoodTransaction).not.toHaveBeenCalled();
      },
    );

    it("signs a transparent send from the account xpub alone (LIVE-36260)", async () => {
      const signOp = buildSignOperation(makeSignerContext());

      const events = await collectEvents(signOp, {
        account: accountWithoutUfvk(),
        deviceId: "device-1",
        transaction: makeTx("transparent"),
      } as never);

      expect(events.map(e => e.type)).toEqual([
        "device-signature-requested",
        "device-signature-granted",
        "signed",
      ]);
      // The transparent account pubkey stands in for the UFVK: same account, and
      // the only key material a transparent build reads.
      expect(mockCraftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transparentAccountPubkey: ACCOUNT_CHAIN_CODE_HEX + ACCOUNT_PUBKEY_HEX,
        }),
      );
      expect(mockCraftTransaction).toHaveBeenCalledWith(
        expect.not.objectContaining({ ufvk: expect.anything() }),
      );
    });

    it("reports a missing xpub rather than building from no key at all", async () => {
      const account = accountWithoutUfvk();
      delete (account as { xpub?: unknown }).xpub;
      const signOp = buildSignOperation(makeSignerContext());

      await expect(
        lastValueFrom(
          signOp({
            account,
            deviceId: "device-1",
            transaction: makeTx("transparent"),
          } as never),
        ),
      ).rejects.toThrow("Missing xpub");
      expect(mockCraftTransaction).not.toHaveBeenCalled();
    });
  });

  it("prefers the UFVK for a transparent send when the account has one", async () => {
    const signOp = buildSignOperation(makeSignerContext());

    await collectEvents(signOp, {
      account: makeAccount(),
      deviceId: "device-1",
      transaction: makeTx("transparent"),
    } as never);

    expect(mockCraftTransaction).toHaveBeenCalledWith(expect.objectContaining({ ufvk: MOCK_UFVK }));
    expect(mockCraftTransaction).toHaveBeenCalledWith(
      expect.not.objectContaining({ transparentAccountPubkey: expect.anything() }),
    );
  });

  it("errors when selectedNotes/zcashFee were not resolved by prepareTransaction", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded");
    delete (tx as { selectedNotes?: unknown }).selectedNotes;
    delete (tx as { zcashFee?: unknown }).zcashFee;
    const signOp = buildSignOperation(makeSignerContext());

    await expect(
      lastValueFrom(signOp({ account, deviceId: "device-1", transaction: tx } as never)),
    ).rejects.toThrow(/selectedNotes|zcashFee/);
  });

  it("propagates a craftTransaction (engine) failure", async () => {
    mockCraftTransaction.mockRejectedValue(new Error("engine unavailable"));
    const account = makeAccount();
    // t→t is the only flow that builds through the V5 craftTransaction path.
    const tx = makeTx("transparent");
    const signOp = buildSignOperation(makeSignerContext());

    await expect(
      lastValueFrom(signOp({ account, deviceId: "device-1", transaction: tx } as never)),
    ).rejects.toThrow("engine unavailable");
  });

  it("propagates a V6 craft failure, such as an engine without the Ironwood builder", async () => {
    mockCraftIronwoodTransaction.mockRejectedValue(
      new Error("Zcash V6 (Ironwood) transactions are not supported in this environment"),
    );
    const signOp = buildSignOperation(makeSignerContext());

    await expect(
      lastValueFrom(
        signOp({
          account: makeAccount(),
          deviceId: "device-1",
          transaction: makeTx("shielded"),
        } as never),
      ),
    ).rejects.toThrow("V6 (Ironwood)");
  });

  // The maturity filter (logic/account/spendability) is meant to make this
  // unreachable; this is the safety net for backend drift between the zaino
  // instance the scan used and the one the builder queries.
  it("surfaces a note-position-past-anchor build failure as the typed domain error", async () => {
    mockCraftIronwoodTransaction.mockRejectedValue(
      new Error(
        "Error invoking remote method 'zcash:buildIronwoodTransaction': " +
          "compute_ironwood_witnesses: note position 55985 is at or past anchor_total_leaves 55976 at anchor height 3447474",
      ),
    );
    const signOp = buildSignOperation(makeSignerContext());

    await expect(
      lastValueFrom(
        signOp({
          account: makeAccount(),
          deviceId: "device-1",
          transaction: makeTx("shielded"),
        } as never),
      ),
    ).rejects.toThrow(ZcashNotesNotYetSpendable);
  });

  it("rejects when the signer does not expose signPcztTransaction", async () => {
    const account = makeAccount();
    const tx = makeTx("shielded");
    const signerContext = jest.fn(async (_deviceId, fn) =>
      fn({ getAddress: jest.fn(), getFullViewingKey: jest.fn() }),
    ) as unknown as SignerContext;
    const signOp = buildSignOperation(signerContext);

    await expect(
      lastValueFrom(signOp({ account, deviceId: "device-1", transaction: tx } as never)),
    ).rejects.toThrow(/signPcztTransaction/);
  });

  // ── memo on operation.extra ───────────────────────────────────────────

  describe("memo on operation.extra", () => {
    it("includes memo in extra when the transaction carries one", async () => {
      const account = makeAccount();
      const tx = makeTx("shielded", { memo: "Hello shielded receiver" });
      const signOp = buildSignOperation(makeSignerContext());

      const events = await collectEvents(signOp, {
        account,
        deviceId: "device-1",
        transaction: tx,
      } as never);

      const signedEvent = events.find(e => e.type === "signed");
      expect(signedEvent?.type).toBe("signed");
      if (signedEvent?.type === "signed") {
        const extra = signedEvent.signedOperation.operation.extra as Record<string, unknown>;
        expect(extra.memo).toBe("Hello shielded receiver");
      }
    });

    it("omits memo from extra when the transaction has none", async () => {
      const account = makeAccount();
      const tx = makeTx("shielded"); // no memo field
      const signOp = buildSignOperation(makeSignerContext());

      const events = await collectEvents(signOp, {
        account,
        deviceId: "device-1",
        transaction: tx,
      } as never);

      const signedEvent = events.find(e => e.type === "signed");
      expect(signedEvent?.type).toBe("signed");
      if (signedEvent?.type === "signed") {
        const extra = signedEvent.signedOperation.operation.extra as Record<string, unknown>;
        expect(extra).not.toHaveProperty("memo");
      }
    });
  });

  describe("shieldedNullifiers on operation.extra", () => {
    beforeEach(() => {
      _resetReservationsForTest();
    });

    it("emits shieldedNullifiers on operation.extra matching tx.selectedNotes nullifiers", async () => {
      const nullifier1 = "11".repeat(32);
      const nullifier2 = "22".repeat(32);
      const notes = [
        makeSpendableNote({ nullifier: nullifier1, outputIndex: 0 }),
        makeSpendableNote({ nullifier: nullifier2, outputIndex: 1 }),
      ];
      const account = makeAccount();
      const tx = makeTx("shielded", {
        selectedNotes: notes,
        zcashFee: new BigNumber(10_000),
        amount: new BigNumber(290_000),
      });
      const signOp = buildSignOperation(makeSignerContext());

      const events = await collectEvents(signOp, {
        account,
        deviceId: "device-1",
        transaction: tx,
      } as never);
      const signedEvent = events.find(e => e.type === "signed");
      expect(signedEvent?.type).toBe("signed");
      if (signedEvent?.type === "signed") {
        const extra = signedEvent.signedOperation.operation.extra as Record<string, unknown>;
        expect(extra).toHaveProperty("shieldedNullifiers");
        expect(extra.shieldedNullifiers).toEqual([nullifier1, nullifier2]);
      }
    });

    it("omits shieldedNullifiers from operation.extra when selectedNotes is empty", async () => {
      // transparent-to-shielded: shields into Ironwood with no note spends
      const account = makeAccount();
      const tx = makeTx("transparent-to-shielded", {
        selectedNotes: [],
        zcashFee: new BigNumber(10_000),
      });
      const signOp = buildSignOperation(
        makeSignerContext({ orchard: [], transparentInputSigs: [], ironwood: [] }),
      );

      const events = await collectEvents(signOp, {
        account,
        deviceId: "device-1",
        transaction: tx,
      } as never);
      const signedEvent = events.find(e => e.type === "signed");
      expect(signedEvent?.type).toBe("signed");
      if (signedEvent?.type === "signed") {
        const extra = signedEvent.signedOperation.operation.extra as Record<string, unknown>;
        expect(extra).not.toHaveProperty("shieldedNullifiers");
      }
    });

    // The reservation is released on the lifecycle of the operation that holds
    // it, which can only find it if signing filed it under that operation's own
    // hash.
    it("reserves the spent notes under the hash of the operation spending them", async () => {
      const nullifier = "33".repeat(32);
      const account = makeAccount();
      const tx = makeTx("shielded", {
        selectedNotes: [makeSpendableNote({ nullifier })],
        zcashFee: new BigNumber(10_000),
      });
      const signOp = buildSignOperation(makeSignerContext());

      const events = await collectEvents(signOp, {
        account,
        deviceId: "device-1",
        transaction: tx,
      } as never);
      const signedEvent = events.find(e => e.type === "signed");

      expect(getSessionReservedNullifiers(account.id).has(nullifier)).toBe(true);
      if (signedEvent?.type === "signed") {
        releaseRetiredReservations(
          account.id,
          new Set([signedEvent.signedOperation.operation.hash]),
        );
      }
      expect(getSessionReservedNullifiers(account.id).size).toBe(0);
    });
  });
});
