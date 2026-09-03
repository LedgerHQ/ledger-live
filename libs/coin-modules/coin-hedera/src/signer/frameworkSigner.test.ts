import { PrivateKey } from "@hashgraph/sdk";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { HEDERA_TRANSACTION_MODES, TINYBAR_SCALE } from "../constants";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import {
  deserializeTransaction,
  getHederaTransactionBodyBytes,
  serializeSignature,
  serializeTransaction,
} from "../logic/utils";
import { rpcClient } from "../network/rpc";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import type { HederaMemo, HederaSigner } from "../types";
import { createFrameworkSigner } from "./frameworkSigner";

jest.mock("../network/rpc", () => ({
  rpcClient: require("../test/fixtures/rpc.fixture").getMockedRpcClient(),
}));

const PATH = "44'/3030'/0'/0'/0'";

const makeIntent = (): TransactionIntent<HederaMemo> => ({
  intentType: "transaction",
  type: HEDERA_TRANSACTION_MODES.Send,
  amount: BigInt(1 * 10 ** TINYBAR_SCALE),
  recipient: "0.0.12345",
  sender: "0.0.54321",
  asset: { type: "native" },
  memo: { kind: "text", type: "string", value: "Hbar transfer" },
});

const makeSigner = (overrides: Partial<HederaSigner> = {}): HederaSigner => ({
  getPublicKey: jest.fn().mockResolvedValue("aabbcc"),
  signTransaction: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  ...overrides,
});

afterAll(async () => {
  await rpcClient._resetInstance();
});

describe("createFrameworkSigner.getAddress", () => {
  it("returns the device public key as both address and publicKey", async () => {
    const device = makeSigner({ getPublicKey: jest.fn().mockResolvedValue("abcd1234") });
    const framework = createFrameworkSigner(device);

    const result = await framework.getAddress(PATH);

    expect(device.getPublicKey).toHaveBeenCalledTimes(1);
    expect(device.getPublicKey).toHaveBeenCalledWith(PATH);
    expect(result).toEqual({ path: PATH, address: "abcd1234", publicKey: "abcd1234" });
  });
});

describe("createFrameworkSigner.signTransaction", () => {
  it("signs the transaction body bytes, not the envelope, dropping path and options", async () => {
    const { serializedTx } = await craftTransaction({
      configOrCurrencyId: getMockedConfig(),
      txIntent: makeIntent(),
    });
    const expectedBodyBytes = getHederaTransactionBodyBytes(deserializeTransaction(serializedTx));
    const signature = new Uint8Array([9, 9, 9]);
    const device = makeSigner({ signTransaction: jest.fn().mockResolvedValue(signature) });
    const framework = createFrameworkSigner(device);

    const result = await framework.signTransaction(PATH, serializedTx);

    expect(device.signTransaction).toHaveBeenCalledTimes(1);
    expect(device.signTransaction).toHaveBeenCalledWith(expectedBodyBytes);
    expect(result).toBe(serializeSignature(signature));
  });
});

describe("createFrameworkSigner byte-identical parity with the legacy bridge", () => {
  it("produces the same combined transaction as the legacy signOperation path", async () => {
    // Craft exactly once: TransactionId.generate uses Timestamp.generate(hasJitter = true),
    // so crafting twice would never yield byte-identical transactions to compare.
    const { tx, serializedTx } = await craftTransaction({
      configOrCurrencyId: getMockedConfig(),
      txIntent: makeIntent(),
    });

    const publicKey = PrivateKey.generateED25519().publicKey.toStringRaw();
    const signatureBytes = new Uint8Array(64).fill(7);
    const device: HederaSigner = {
      getPublicKey: jest.fn().mockResolvedValue(publicKey),
      signTransaction: jest.fn().mockResolvedValue(signatureBytes),
    };
    const framework = createFrameworkSigner(device);

    const legacy = combine(
      serializeTransaction(tx),
      [serializeSignature(await device.signTransaction(getHederaTransactionBodyBytes(tx)))],
      publicKey,
    );

    const { publicKey: frameworkPublicKey } = await framework.getAddress(PATH);
    const generic = combine(
      serializedTx,
      [await framework.signTransaction(PATH, serializedTx)],
      frameworkPublicKey,
    );

    expect(generic).toBe(legacy);
  });
});
