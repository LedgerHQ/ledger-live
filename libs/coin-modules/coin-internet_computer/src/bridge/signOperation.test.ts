import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { buildSignOperation } from "./signOperation";

const XPUB =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const ACCOUNT_ID = "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417";

const account = {
  id: "js:2:internet_computer:test:",
  xpub: XPUB,
  freshAddress: ACCOUNT_ID,
  freshAddressPath: "44'/223'/0'/0/0",
} as any;

const tx = (over: Partial<Transaction>): Transaction =>
  ({
    family: "internet_computer",
    amount: new BigNumber(1000),
    fees: new BigNumber(10000),
    recipient: "",
    useAllAmount: false,
    ...over,
  }) as Transaction;

const makeSigner = () => ({
  sign: jest.fn().mockResolvedValue({
    returnCode: 0x9000,
    signatureRS: Buffer.alloc(64, 1),
    signatureDER: Buffer.alloc(70, 2),
  }),
  signUpdateCall: jest.fn().mockResolvedValue({
    returnCode: 0x9000,
    requestSignatureRS: Buffer.alloc(64, 1),
    readStateSignatureRS: Buffer.alloc(64, 2),
    readStateBody: Buffer.alloc(8),
  }),
});

const run = (signer: any, transaction: Transaction): Promise<any[]> =>
  new Promise((resolve, reject) => {
    const events: any[] = [];
    const signerContext = (_deviceId: string, fn: any) => fn(signer);
    buildSignOperation(signerContext as any)({
      account,
      transaction,
      deviceId: "dev",
    } as any).subscribe({
      next: (e: any) => events.push(e),
      error: reject,
      complete: () => resolve(events),
    });
  });

const signedRawData = (events: any[]) =>
  events.find(e => e.type === "signed").signedOperation.rawData;

describe("buildSignOperation routing", () => {
  it("signs a plain transfer via sign() (no stake flag) and emits a ledger call blob", async () => {
    const signer = makeSigner();
    const raw = signedRawData(
      await run(signer, tx({ type: "send", recipient: ACCOUNT_ID, memo: "5" })),
    );

    expect(signer.sign).toHaveBeenCalledWith(expect.any(String), expect.any(Buffer), false);
    expect(signer.signUpdateCall).not.toHaveBeenCalled();
    expect(raw.methodName).toBe("send");
    expect(raw.transferRequestIdHex).toMatch(/^[0-9a-f]+$/);
    expect(raw.encodedSignedCallBlob).toMatch(/^[0-9a-f]+$/);
  });

  it("passes the stake flag when signing a create_neuron transfer", async () => {
    const signer = makeSigner();
    await run(signer, tx({ type: "create_neuron", recipient: ACCOUNT_ID, memo: "42" }));
    expect(signer.sign).toHaveBeenCalledWith(expect.any(String), expect.any(Buffer), true);
  });

  it("signs a governance op via signUpdateCall() and emits call + read-state blobs", async () => {
    const signer = makeSigner();
    const raw = signedRawData(await run(signer, tx({ type: "start_dissolving", neuronId: "7" })));

    expect(signer.signUpdateCall).toHaveBeenCalled();
    expect(signer.sign).not.toHaveBeenCalled();
    expect(raw.methodName).toBe("start_dissolving");
    expect(raw.requestId).toMatch(/^[0-9a-f]+$/);
    expect(raw.encodedSignedReadStateBlob).toMatch(/^[0-9a-f]+$/);
  });

  it("types a governance op so it stays out of account history", async () => {
    const events = await run(makeSigner(), tx({ type: "refresh_voting_power", neuronId: "7" }));

    expect(events.find(e => e.type === "signed").signedOperation.operation.type).toBe("NONE");
  });

  it.each([
    ["send", "OUT"],
    ["create_neuron", "STAKE_NEURON"],
    ["increase_stake", "TOP_UP_NEURON"],
  ])("keeps %s in history as a real transfer, typed %s", async (type, expected) => {
    const events = await run(makeSigner(), tx({ type, recipient: ACCOUNT_ID, memo: "1" } as never));

    expect(events.find(e => e.type === "signed").signedOperation.operation.type).toBe(expected);
  });
});
