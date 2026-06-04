import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getNetworkParameters } from "../networks";
import typhonSerializer from "../typhonSerializer";
import { assembleWitnesses } from "./assembleWitnesses";
import { buildUnsignedTransactionForSigning } from "./craftTransaction";
import { signCoinModuleTransaction } from "./signCoinModuleTransaction";

jest.mock("./craftTransaction");
jest.mock("../typhonSerializer");
jest.mock("./assembleWitnesses");

const mockBuild = jest.mocked(buildUnsignedTransactionForSigning);
const mockSerializer = jest.mocked(typhonSerializer);
const mockAssemble = jest.mocked(assembleWitnesses);

const currency = getCryptoCurrencyById("cardano");
const DERIVATION_PATH = "1852'/1815'/0'/0/0";
// A real 128-hex account xpub (datasets/rawAccount.1.ts) so getExtendedPublicKeyFromHex parses it.
const PUBLIC_KEY_HEX = "806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ce";
const CHAIN_CODE_HEX = "b3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d";

// Device witnesses for a delegation: payment (chain 0) + stake (chain 2).
const witnesses = [
  { path: [1852, 1815, 0, 0, 0], witnessSignatureHex: "aa" },
  { path: [1852, 1815, 0, 2, 0], witnessSignatureHex: "bb" },
];

const fakeUnsignedTx = { tag: "unsigned-tx" } as never;
const fakeSerialized = { tag: "serialized" } as never;

const getPublicKey = jest.fn(async () => ({
  publicKeyHex: PUBLIC_KEY_HEX,
  chainCodeHex: CHAIN_CODE_HEX,
}));
const sign = jest.fn(async () => ({ txHashHex: "txhash", witnesses }));
const fakeSigner = { getPublicKey, sign } as never;
const signerContext = jest.fn((_deviceId: string, fn: (signer: never) => Promise<unknown>) =>
  fn(fakeSigner),
) as never;

const intent = { intentType: "staking", mode: "delegate", sender: "addr", recipient: "addr" } as never;

beforeEach(() => {
  jest.clearAllMocks();
  mockBuild.mockResolvedValue(fakeUnsignedTx);
  mockSerializer.mockReturnValue(fakeSerialized);
  mockAssemble.mockReturnValue({ hash: "txhash", payload: "signed-payload" } as never);
});

describe("signCoinModuleTransaction", () => {
  it("builds with paths, signs every path on device, and assembles the full witness set", async () => {
    const onDeviceSignatureRequested = jest.fn();

    const result = await signCoinModuleTransaction({
      currency,
      intent,
      derivationPath: DERIVATION_PATH,
      deviceId: "device-1",
      signerContext,
      onDeviceSignatureRequested,
    });

    // Builds the path-bearing unsigned tx from the intent, serializes with the account index.
    expect(mockBuild).toHaveBeenCalledWith(currency, intent, DERIVATION_PATH, undefined);
    expect(mockSerializer).toHaveBeenCalledWith(fakeUnsignedTx, 0);

    // Fetches the account extended pubkey from the account path, then signs.
    expect(getPublicKey).toHaveBeenCalledWith("1852'/1815'/0'");
    expect(onDeviceSignatureRequested).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith({
      transaction: fakeSerialized,
      networkParams: getNetworkParameters(currency.id),
    });

    // Assembles every device witness (payment + stake) into the signed tx.
    expect(mockAssemble).toHaveBeenCalledTimes(1);
    expect(mockAssemble.mock.calls[0][0]).toBe(fakeUnsignedTx);
    expect(mockAssemble.mock.calls[0][2]).toBe(witnesses);

    expect(result).toEqual({ signature: "signed-payload" });
  });

  it("aborts cleanly when the device signature is cancelled (signerContext resolves falsy)", async () => {
    const cancelledSignerContext = jest.fn(async () => undefined) as never;

    const result = await signCoinModuleTransaction({
      currency,
      intent,
      derivationPath: DERIVATION_PATH,
      deviceId: "device-1",
      signerContext: cancelledSignerContext,
    });

    expect(result).toBeNull();
    expect(mockAssemble).not.toHaveBeenCalled();
  });

  it("forwards custom fees to the builder", async () => {
    const customFees = { value: 200000n } as never;
    await signCoinModuleTransaction({
      currency,
      intent,
      derivationPath: DERIVATION_PATH,
      deviceId: "device-1",
      signerContext,
      customFees,
    });
    expect(mockBuild).toHaveBeenCalledWith(currency, intent, DERIVATION_PATH, customFees);
  });
});
