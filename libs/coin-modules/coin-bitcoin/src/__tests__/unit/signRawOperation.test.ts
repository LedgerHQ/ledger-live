import { BigNumber } from "bignumber.js";
import { firstValueFrom, skip, toArray } from "rxjs";
import buildSignRawOperation from "../../signRawOperation";
import { extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import type { Account, Operation } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";

// ---- Mocks ---------------------------------------------------------------

jest.mock("../../cache", () => ({
  // Deterministic fallback fees (used if PSBT parsing fails)
  calculateFees: jest.fn().mockResolvedValue({
    fees: new BigNumber(1000), // 1000 sats
    txInputs: [{ address: "bc1qsender..." }],
    txOutputs: [{ address: "bc1qrecipient...", isChange: false, value: 5000 }],
  }),
}));

jest.mock("../../buildTransaction", () => ({
  buildTransaction: jest.fn().mockResolvedValue({
    /* not used by PSBT path */
  }),
}));

jest.mock("../../networks", () => ({
  getNetworkParameters: jest.fn().mockReturnValue({ sigHash: 1 }),
}));

// Wallet account mock includes address methods so tests that exercise the real
// buildKnownAddressDerivationsMap implementation can use it without extra setup.
jest.mock("../../wallet-btc", () => ({
  getWalletAccount: jest.fn().mockReturnValue({
    params: { path: "m/84'/0'/0'", index: 0 },
    xpub: {
      xpub: "xpub",
      getAccountAddresses: jest.fn().mockResolvedValue([]),
      getNewAddress: jest.fn().mockResolvedValue({ address: "bc1q_dummy", account: 0, index: 0 }),
      crypto: {
        getPubkeyAt: jest.fn().mockResolvedValue(Buffer.alloc(33, 0x02)),
        toOutputScript: jest
          .fn()
          .mockReturnValue(Buffer.concat([Buffer.from("0014", "hex"), Buffer.alloc(20, 0)])),
      },
    },
  }),
  default: {},
}));

jest.mock("@ledgerhq/coin-framework/derivation", () => {
  const actual = jest.requireActual("@ledgerhq/coin-framework/derivation");
  return {
    ...actual,
    isSegwitDerivationMode: () => true,
    getAddressFormatDerivationMode: jest.fn().mockReturnValue("p2wpkh"),
  };
});

// Auto-mock the module so Jest creates a configurable mock for the named export.
// Individual tests can switch to the real implementation via jest.requireActual.
jest.mock("../../knownAddressDerivations");

// Shorthand to get the mock function after hoisting completes.
const mockBuildKnownMap = () =>
  (jest.requireMock("../../knownAddressDerivations") as any)
    .buildKnownAddressDerivationsMap as jest.Mock;

beforeEach(() => {
  mockBuildKnownMap().mockResolvedValue(new Map());
});

afterEach(() => {
  mockBuildKnownMap().mockReset();
});

// ---- Helpers -------------------------------------------------------------

const makeAccount = (over: Partial<Account> = {}): Account => ({
  id: "js:2:bitcoin:dummy",
  type: "Account",
  used: true,
  operationsCount: 0,
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
  freshAddress: "bc1q...",
  freshAddressPath: "m/84'/0'/0'/0/0",
  currency: findCryptoCurrencyById("bitcoin")!,
  derivationMode: "native_segwit",
  seedIdentifier: "seed",
  xpub: "xpub...",
  index: 0,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  blockHeight: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(0),
  creationDate: new Date(0),
  ...over,
});

type MockSigner = {
  signPsbtBuffer: jest.Mock<any, any>;
};

const makeSignerContext =
  (signer: MockSigner) => async (_deviceId: string, _currency: any, fn: (s: any) => any) =>
    fn(signer);

// A real PSBTv2 (base64): input 20_000 sats, output 15_000 sats → fee 5_000 sats
const PSBT_V2_B64 =
  "cHNidP8BAgQCAAAAAQMEAAAAAAEEAQEBBQEBAQYBAAH7BAIAAAAAAQEfIE4AAAAAAAAWABRtTfPDGS0+/pTZAN6itD4d+v/DdwEIbAJIMEUCIQCKyNguNXRp8g9Xx8218oMR6nmpYT5DjKR4tFVAUxWEmwIgT1D7gJxboLCae6jHiRilShygUhanylrY4Zy5/zTV5y8BIQKB3M6ZYBlVePq12AbQv1bCn2VPDoa61Ek9vvoauC88vQEOIBpm0EPKluAy05yTYGzOS3gm/qhPQLDCSWqQpVE2pyVMAQ8EAQAAAAABAwiYOgAAAAAAAAEEFgAUgOCAoBDcwBoMygQ0Q5VYjll5FTgA";
const EXPECTED_PSBT_FEE = 5000;

// -------------------------------------------------------------------------

describe("signRawOperation (PSBT path)", () => {
  test("returns tx hex in signature and psbtSigned in rawData; value/fee from PSBT", async () => {
    const txHex = "01020304";
    const signer: MockSigner = {
      signPsbtBuffer: jest.fn().mockImplementation((_psbtBuffer: Buffer, options?: any) => {
        options?.onDeviceSignatureRequested?.();
        options?.onDeviceSignatureGranted?.();
        options?.onDeviceStreaming?.({ progress: 0.5, index: 1, total: 2 });
        return Promise.resolve({
          psbt: Buffer.from(PSBT_V2_B64, "base64"),
          tx: txHex,
        });
      }),
    };
    const signRawOperation = buildSignRawOperation(makeSignerContext(signer));
    const account = makeAccount();

    const events = await firstValueFrom(
      signRawOperation({ account, deviceId: "mock", transaction: PSBT_V2_B64 }).pipe(toArray()),
    );

    const types = events.map(e => e.type);
    expect(types).toContain("device-streaming");
    expect(types).toContain("device-signature-requested");
    expect(types).toContain("device-signature-granted");

    const streamingEvents = events.filter(e => e.type === "device-streaming");
    expect(streamingEvents).toHaveLength(1);
    expect(streamingEvents[0]).toEqual({
      type: "device-streaming",
      progress: 0.5,
      index: 1,
      total: 2,
    });

    const signedEvt = events.find(e => e.type === "signed");
    if (!signedEvt || signedEvt.type !== "signed") throw new Error("No signed event");
    const { signedOperation } = signedEvt;

    expect(signedOperation.rawData?.psbtSigned).toBe(PSBT_V2_B64);
    expect(signedOperation.signature).toBe(txHex);

    const op: Operation = signedOperation.operation;
    expect(op.fee.toNumber()).toBe(EXPECTED_PSBT_FEE);
    expect(op.value.toNumber()).toBe(EXPECTED_PSBT_FEE);
    expect(op.senders).toEqual([]);
    expect(op.recipients).toEqual([]);

    const [, opts] = signer.signPsbtBuffer.mock.calls[0];
    expect(opts).toMatchObject({
      accountPath: "m/84'/0'/0'/0'",
      addressFormat: "p2wpkh",
      finalizePsbt: false,
    });
    expect(opts.knownAddressDerivations).toBeInstanceOf(Map);
  });

  test("fresh addresses from wallet account are in the derivations map forwarded to signer", async () => {
    // Use the real buildKnownAddressDerivationsMap — this test exercises the full
    // contract: a wallet account's fresh (not-yet-used) addresses must reach the
    // hardware signer so it can identify change outputs in PSBTs.
    const { buildKnownAddressDerivationsMap: realFn } = jest.requireActual(
      "../../knownAddressDerivations",
    );
    mockBuildKnownMap().mockImplementation(realFn);

    // A known fresh change address at chain=1, index=1.
    const freshChangeScript = Buffer.concat([
      Buffer.from("0014", "hex"),
      Buffer.from([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ]);
    const freshChangePubkey = Buffer.from([
      0x02, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0,
    ]);

    // Override wallet account for this test so getNewAddress returns our fixture.
    (jest.requireMock("../../wallet-btc") as any).getWalletAccount.mockReturnValueOnce({
      params: { path: "m/84'/0'/0'", index: 0 },
      xpub: {
        xpub: "xpub_test",
        getAccountAddresses: jest.fn().mockResolvedValue([]),
        getNewAddress: jest.fn().mockImplementation(async (account: number, gap: number) => ({
          address: `bc1q_fresh_a${account}_g${gap}`,
          account,
          index: gap,
        })),
        crypto: {
          getPubkeyAt: jest
            .fn()
            .mockImplementation(async (_xpub: string, account: number, index: number) => {
              if (account === 1 && index === 1) return freshChangePubkey;
              return Buffer.alloc(33, 0x02);
            }),
          toOutputScript: jest.fn().mockImplementation((address: string) => {
            if (address === "bc1q_fresh_a1_g1") return freshChangeScript;
            // Other fresh addresses return a dummy but valid P2WPKH script
            return Buffer.concat([Buffer.from("0014", "hex"), Buffer.alloc(20, 0)]);
          }),
        },
      },
    });

    const signer: MockSigner = {
      signPsbtBuffer: jest.fn().mockResolvedValue({
        psbt: Buffer.from(PSBT_V2_B64, "base64"),
        tx: "aabbccdd",
      }),
    };

    await firstValueFrom(
      buildSignRawOperation(makeSignerContext(signer))({
        account: makeAccount(),
        deviceId: "mock",
        transaction: PSBT_V2_B64,
      }).pipe(toArray()),
    );

    const [, opts] = signer.signPsbtBuffer.mock.calls[0];
    const map = opts.knownAddressDerivations as Map<string, { pubkey: Buffer; path: number[] }>;
    expect(map).toBeInstanceOf(Map);

    // The fresh change address must be reachable by its script hash — this is
    // the contract the fix enforces: the hardware app can identify the change output.
    const hashResult = extractHashFromScriptPubKey(freshChangeScript);
    expect(hashResult).toBeDefined();
    expect(map.has(hashResult!.hashHex)).toBe(true);

    const entry = map.get(hashResult!.hashHex)!;
    expect(entry.pubkey).toEqual(freshChangePubkey);
  });

  test("invalid base64 PSBT errors early", async () => {
    const signer: MockSigner = { signPsbtBuffer: jest.fn() };
    const signRawOperation = buildSignRawOperation(makeSignerContext(signer));
    const account = makeAccount();

    await expect(
      firstValueFrom(
        signRawOperation({ account, deviceId: "mock", transaction: "!!!not-base64!!!" }).pipe(
          skip(1),
        ),
      ),
    ).rejects.toThrow(/PSBT signing failed: no result from device for account/);
  });
});
