import { BigNumber } from "bignumber.js";
import { firstValueFrom, skip, toArray } from "rxjs";
import buildSignRawOperation from "../../signRawOperation";
import type { Account, Operation } from "@ledgerhq/types-live";

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

jest.mock("../../wallet-btc", () => ({
  getWalletAccount: jest.fn().mockReturnValue({
    params: { path: "m/84'/0'/0'", index: 0 },
  }),
  default: {}, // default export not used in PSBT path
}));

// Keep derivation helpers deterministic
jest.mock("@ledgerhq/coin-framework/derivation", () => {
  const actual = jest.requireActual("@ledgerhq/coin-framework/derivation");
  return {
    ...actual,
    isSegwitDerivationMode: () => true,
    getAddressFormatDerivationMode: jest.fn().mockReturnValue("p2wpkh"),
  };
});

// ---- Helpers -------------------------------------------------------------

const makeAccount = (over: Partial<Account> = {}): Account =>
  ({
    id: "js:2:bitcoin:dummy",
    name: "BTC",
    type: "Account",
    used: true,
    operationsCount: 0,
    balanceHistoryCache: {} as any,
    swapHistory: [],
    freshAddress: "bc1q...",
    freshAddressPath: "m/84'/0'/0'/0/0",
    currency: { id: "bitcoin", family: "bitcoin", ticker: "BTC", name: "Bitcoin" } as any,
    unit: { name: "satoshi", code: "sat", magnitude: 0 } as any,
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
  }) as unknown as Account;

type MockSigner = {
  signPsbtV2Buffer: jest.Mock<any, any>;
};

const makeSignerContext =
  (signer: MockSigner) =>
  // SignerContext: (deviceId, currency, fn) => Promise<ReturnType<fn>>
  async (_deviceId: string, _currency: any, fn: (s: any) => any) =>
    fn(signer);

// A real PSBTv2 (base64) with: input 20_000 sats, output 15_000 sats => fee 5_000 sats
const PSBT_V2_B64 =
  "cHNidP8BAgQCAAAAAQMEAAAAAAEEAQEBBQEBAQYBAAH7BAIAAAAAAQEfIE4AAAAAAAAWABRtTfPDGS0+/pTZAN6itD4d+v/DdwEIbAJIMEUCIQCKyNguNXRp8g9Xx8218oMR6nmpYT5DjKR4tFVAUxWEmwIgT1D7gJxboLCae6jHiRilShygUhanylrY4Zy5/zTV5y8BIQKB3M6ZYBlVePq12AbQv1bCn2VPDoa61Ek9vvoauC88vQEOIBpm0EPKluAy05yTYGzOS3gm/qhPQLDCSWqQpVE2pyVMAQ8EAQAAAAABAwiYOgAAAAAAAAEEFgAUgOCAoBDcwBoMygQ0Q5VYjll5FTgA";
const EXPECTED_PSBT_FEE = 5000; // sats

// -------------------------------------------------------------------------

describe("signOperation (PSBT path)", () => {
  test("returns tx hex in signature and psbtSigned in rawData; value/fee from PSBT", async () => {
    const txHex = "01020304";
    const signer: MockSigner = {
      signPsbtV2Buffer: jest.fn().mockResolvedValue({
        psbt: Buffer.from(PSBT_V2_B64, "base64"),
        tx: txHex,
      }),
    };
    const signerContext = makeSignerContext(signer);
    const signOperation = buildSignRawOperation(signerContext);

    const account = makeAccount();

    const emissions = await firstValueFrom(
      signOperation({ account, deviceId: "mock", transaction: PSBT_V2_B64 }).pipe(toArray()),
    );

    // Events should include requested and granted
    const types = emissions.map(e => e.type);
    expect(types).toContain("device-signature-requested");
    expect(types).toContain("device-signature-granted");

    const signedEvt = emissions.find(e => e.type === "signed") as any;
    const { signedOperation } = signedEvt;

    // rawData and signature checks
    expect(signedOperation.rawData?.psbtSigned).toBe(PSBT_V2_B64);
    expect(signedOperation.signature).toBe(txHex);

    // fee/value taken from PSBT
    const op: Operation = signedOperation.operation;
    expect(op.fee.toNumber()).toBe(EXPECTED_PSBT_FEE);
    expect(op.value.toNumber()).toBe(EXPECTED_PSBT_FEE);
    expect(op.senders).toEqual([]);
    expect(op.recipients).toEqual([]);

    // Options propagated
    const [, opts] = (signer.signPsbtV2Buffer as jest.Mock).mock.calls[0];
    expect(opts).toMatchObject({
      accountPath: "m/84'/0'/0'/0'",
      addressFormat: "p2wpkh",
    });
  });

  test("invalid base64 PSBT errors early", async () => {
    const signer: MockSigner = {
      signPsbtV2Buffer: jest.fn(),
    };
    const signerContext = makeSignerContext(signer);
    const signOperation = buildSignRawOperation(signerContext);

    const account = makeAccount();

    await expect(
      firstValueFrom(
        signOperation({ account, deviceId: "mock", transaction: "!!!not-base64!!!" }).pipe(skip(1)),
      ),
    ).rejects.toThrow(/Invalid PSBT/);
  });
});
