import { BigNumber } from "bignumber.js";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/types";
import { buildAccountTx, signAccountTx } from "../../buildAndSign";
import type { BitcoinSigner } from "../../signer";

jest.mock("../../rbfFees", () => ({
  getMinReplacementFeeSat: jest.fn(),
  getTxInputOutpoints: jest.fn(),
}));
import { getMinReplacementFeeSat, getTxInputOutpoints } from "../../rbfFees";

const mockedGetMinReplacementFeeSat = getMinReplacementFeeSat as jest.Mock;
const mockedGetTxInputOutpoints = getTxInputOutpoints as jest.Mock;

const p2wpkhScript = Buffer.concat([Buffer.from("0014", "hex"), Buffer.alloc(20, 0)]);

const makeTxInfo = (over: Partial<TransactionInfo> = {}): TransactionInfo =>
  ({
    inputs: [
      {
        txHex: "0100000001abcd",
        output_index: 0,
        value: "20000",
        address: "addr-in",
        output_hash: "hash-in",
        sequence: 0xfffffffd,
        block_height: 700000,
      },
    ],
    associatedDerivations: [[0, 0]],
    outputs: [
      { script: p2wpkhScript, value: new BigNumber(15000), address: "dest", isChange: false },
      { script: p2wpkhScript, value: new BigNumber(4000), address: "change-addr", isChange: true },
    ],
    fee: new BigNumber(1000),
    changeAddress: { address: "change-addr", account: 1, index: 1 },
    ...over,
  }) as unknown as TransactionInfo;

const makeAccount = (xpubOver: Record<string, unknown> = {}) =>
  ({
    params: { path: "44'/0'", index: 0 },
    xpub: {
      currentBlockHeight: 800000,
      getNewAddress: jest.fn().mockResolvedValue({ address: "change-addr", account: 1, index: 1 }),
      buildTx: jest.fn().mockResolvedValue(makeTxInfo()),
      ...xpubOver,
    },
  }) as any;

const makeSigner = (): jest.Mocked<
  Pick<BitcoinSigner, "splitTransaction" | "createPaymentTransaction">
> => ({
  splitTransaction: jest
    .fn()
    .mockReturnValue({ version: Buffer.from(""), inputs: [], outputs: [] }),
  createPaymentTransaction: jest.fn().mockResolvedValue("signed-tx-hex"),
});

const baseBuildParams = (account: any) => ({
  fromAccount: account,
  dest: "dest-addr",
  amount: new BigNumber(15000),
  feePerByte: 5,
  utxoPickingStrategy: {} as any,
  sequence: 0xfffffffd,
});

beforeEach(() => jest.clearAllMocks());

describe("buildAccountTx", () => {
  it("resolves change address and forwards the params to xpub.buildTx", async () => {
    const account = makeAccount();
    const txInfo = await buildAccountTx(baseBuildParams(account));

    expect(account.xpub.getNewAddress).toHaveBeenCalledWith(1, 1);
    expect(account.xpub.buildTx).toHaveBeenCalledWith(
      expect.objectContaining({
        destAddress: "dest-addr",
        amount: new BigNumber(15000),
        feePerByte: 5,
        sequence: 0xfffffffd,
        changeAddress: { address: "change-addr", account: 1, index: 1 },
      }),
    );
    expect(txInfo.outputs).toHaveLength(2);
  });

  it("throws when a mismatching change address is provided", async () => {
    const account = makeAccount();
    await expect(
      buildAccountTx({ ...baseBuildParams(account), changeAddress: "wrong-addr" }),
    ).rejects.toThrow("Invalid change address");
  });

  it("passes a positive replacement min fee when replacing an original tx", async () => {
    const account = makeAccount();
    mockedGetTxInputOutpoints.mockResolvedValue(new Set(["hash-in:0"]));
    mockedGetMinReplacementFeeSat.mockResolvedValue(new BigNumber(1234));

    await buildAccountTx({ ...baseBuildParams(account), originalTxId: "orig-tx" });

    expect(account.xpub.buildTx).toHaveBeenCalledWith(
      expect.objectContaining({ originalTxId: "orig-tx", minReplacementFeeSat: 1234 }),
    );
  });

  it("omits minReplacementFeeSat when the replacement fee resolves to zero", async () => {
    const account = makeAccount();
    mockedGetTxInputOutpoints.mockResolvedValue(new Set<string>());
    mockedGetMinReplacementFeeSat.mockResolvedValue(new BigNumber(0));

    await buildAccountTx({ ...baseBuildParams(account), originalTxId: "orig-tx" });

    const call = account.xpub.buildTx.mock.calls[0][0];
    expect(call.originalTxId).toBe("orig-tx");
    expect(call).not.toHaveProperty("minReplacementFeeSat");
  });

  it("forwards a relay fee floor when provided", async () => {
    const account = makeAccount();
    await buildAccountTx({
      ...baseBuildParams(account),
      relayFeePerByteSatVb: new BigNumber(2),
    });
    expect(account.xpub.buildTx).toHaveBeenCalledWith(
      expect.objectContaining({ relayFeePerByteSatVb: new BigNumber(2) }),
    );
  });
});

describe("signAccountTx", () => {
  it("serializes outputs/inputs and calls createPaymentTransaction, returning its result", async () => {
    const account = makeAccount();
    const btc = makeSigner();

    const tx = await signAccountTx({
      btc: btc as unknown as BitcoinSigner,
      fromAccount: account,
      txInfo: makeTxInfo(),
    });

    expect(tx).toBe("signed-tx-hex");
    expect(btc.splitTransaction).toHaveBeenCalledWith("0100000001abcd", true, undefined, undefined);
    const arg = btc.createPaymentTransaction.mock.calls[0][0];
    expect(arg.associatedKeysets).toEqual(["44'/0'/0'/0/0"]);
    expect(arg.blockHeight).toBe(800000);
    expect(typeof arg.outputScriptHex).toBe("string");
    // input tuple carries [splitTx, output_index, null, sequence, block_height]
    expect(arg.inputs[0][1]).toBe(0);
    expect(arg.inputs[0][3]).toBe(0xfffffffd);
    expect(arg.inputs[0][4]).toBe(700000);
  });

  it("sets changePath when the last output is change", async () => {
    const account = makeAccount();
    const btc = makeSigner();
    await signAccountTx({
      btc: btc as unknown as BitcoinSigner,
      fromAccount: account,
      txInfo: makeTxInfo(),
    });
    const arg = btc.createPaymentTransaction.mock.calls[0][0];
    expect(arg.changePath).toBe("44'/0'/0'/1/1");
  });

  it("does not set changePath when the last output is not change", async () => {
    const account = makeAccount();
    const btc = makeSigner();
    const txInfo = makeTxInfo({
      outputs: [
        { script: p2wpkhScript, value: new BigNumber(15000), address: "dest", isChange: false },
      ] as any,
    });
    await signAccountTx({ btc: btc as unknown as BitcoinSigner, fromAccount: account, txInfo });
    expect(btc.createPaymentTransaction.mock.calls[0][0]).not.toHaveProperty("changePath");
  });

  it("forwards optional signing params and device callbacks", async () => {
    const account = makeAccount();
    const btc = makeSigner();
    const onDeviceSignatureRequested = jest.fn();
    const onDeviceSignatureGranted = jest.fn();
    const onDeviceStreaming = jest.fn();

    await signAccountTx({
      btc: btc as unknown as BitcoinSigner,
      fromAccount: account,
      txInfo: makeTxInfo(),
      lockTime: 12,
      sigHashType: 1,
      segwit: true,
      onDeviceSignatureRequested,
      onDeviceSignatureGranted,
      onDeviceStreaming,
    });

    const arg = btc.createPaymentTransaction.mock.calls[0][0];
    expect(arg).toMatchObject({ lockTime: 12, sigHashType: 1, segwit: true });
    expect(arg.onDeviceSignatureRequested).toBe(onDeviceSignatureRequested);
    expect(arg.onDeviceSignatureGranted).toBe(onDeviceSignatureGranted);
    expect(arg.onDeviceStreaming).toBe(onDeviceStreaming);
  });

  it("adds decred-specific output serialization when the additional is set", async () => {
    const account = makeAccount();
    const btc = makeSigner();
    await signAccountTx({
      btc: btc as unknown as BitcoinSigner,
      fromAccount: account,
      txInfo: makeTxInfo(),
      additionals: ["decred"],
    });
    const arg = btc.createPaymentTransaction.mock.calls[0][0];
    expect(arg.additionals).toEqual(["decred"]);
    expect(btc.splitTransaction).toHaveBeenCalledWith("0100000001abcd", true, undefined, [
      "decred",
    ]);
  });
});
