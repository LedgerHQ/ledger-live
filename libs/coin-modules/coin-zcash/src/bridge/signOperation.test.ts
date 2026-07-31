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
import type { SpendableNote } from "../network/types";
import type { SignerContext } from "../types/signer";
import type { Transaction, ZcashAccount } from "../types/bridge";

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
  // requires; every other flow goes through the v1/V5 builder.
  it.each([
    ["shielded", "z→z", "v1"],
    ["shielded-to-transparent", "z→t", "v1"],
    ["transparent-to-shielded", "t→z", "v6"],
    ["transparent", "t→t", "v1"],
    ["ironwood", "iw→iw", "v6"],
    ["ironwood-to-transparent", "iw→t", "v6"],
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

  it("errors when the account has no UFVK yet (not synced)", async () => {
    const account = makeAccount();
    delete (account as { privateInfo?: unknown }).privateInfo;
    const tx = makeTx("shielded");
    const signOp = buildSignOperation(makeSignerContext());

    await expect(
      lastValueFrom(signOp({ account, deviceId: "device-1", transaction: tx } as never)),
    ).rejects.toThrow("Missing UFVK");
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
    const tx = makeTx("shielded");
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
          transaction: makeTx("ironwood"),
        } as never),
      ),
    ).rejects.toThrow("V6 (Ironwood)");
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
});
