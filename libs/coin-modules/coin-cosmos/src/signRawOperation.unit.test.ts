import { AminoMsg, makeSignDoc, serializeSignDoc } from "@cosmjs/amino";
import { Secp256k1, Secp256k1Signature, sha256 } from "@cosmjs/crypto";
import { ExpertModeRequired, UserRefusedOnDevice } from "@ledgerhq/errors";
import { firstValueFrom, toArray } from "rxjs";
import { buildSignRawOperation } from "./signRawOperation";
import { CosmosAccount, RETURN_CODES } from "./types";
import { CosmosSigner } from "./types/signer";

const SUCCESS = 0x9000; // 36864

const privkey = sha256(Buffer.from("coin-cosmos signRawOperation test seed"));

function makeAccount(freshAddressPath = "44'/118'/0'/0/0"): CosmosAccount {
  return {
    id: "js:2:cosmos:cosmos1xxx:",
    freshAddress: "cosmos1xxx",
    freshAddressPath,
    currency: { id: "cosmos", units: [{ code: "ATOM" }, { code: "uatom" }] },
  } as unknown as CosmosAccount;
}

function makeSignDocJson(msgs: AminoMsg[]): string {
  const fee = { amount: [{ denom: "uatom", amount: "500" }], gas: "200000" };
  return JSON.stringify(makeSignDoc(msgs, fee, "cosmoshub-4", "", "1", "2"));
}

// Signer that produces a real DER secp256k1 signature over the bytes it receives.
function makeRealSigner(): CosmosSigner & { sign: jest.Mock } {
  const sign = jest.fn(async (_path: number[], buffer: Buffer) => {
    const sig = await Secp256k1.createSignature(sha256(buffer), privkey);
    return { signature: Buffer.from(sig.toDer()), return_code: SUCCESS };
  });
  return { sign } as unknown as CosmosSigner & { sign: jest.Mock };
}

const signerContextOf =
  (signer: CosmosSigner) => (_deviceId: string, fn: (s: CosmosSigner) => any) =>
    fn(signer);

const MSG_SEND: AminoMsg[] = [
  {
    type: "cosmos-sdk/MsgSend",
    value: {
      from_address: "cosmos1xxx",
      to_address: "cosmos1yyy",
      amount: [{ denom: "uatom", amount: "1000" }],
    },
  },
];

const MSG_DELEGATE_WRAPPED: AminoMsg[] = [
  {
    type: "/babylon.epoching.v1.MsgWrappedDelegate",
    value: {
      msg: {
        delegator_address: "cosmos1xxx",
        validator_address: "cosmosvaloper1zzz",
        amount: { denom: "uatom", amount: "1000" },
      },
    },
  },
];

describe("buildSignRawOperation", () => {
  it("signs an amino StdSignDoc and returns a verifiable detached 64-byte signature", async () => {
    const signer = makeRealSigner();
    const transaction = makeSignDocJson(MSG_SEND);
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    const events = await firstValueFrom(
      signRawOperation({
        account: makeAccount(),
        deviceId: "mock",
        transaction,
      }).pipe(toArray()),
    );

    expect(events.map(e => e.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);

    // The device signs the canonical serialized signDoc, verbatim.
    const expectedBytes = Buffer.from(serializeSignDoc(JSON.parse(transaction)));
    expect(Buffer.from(signer.sign.mock.calls[0][1])).toEqual(expectedBytes);
    // coin type 118 → HRP is not passed (only ethermint/60 needs it).
    expect(signer.sign.mock.calls[0][2]).toBeUndefined();

    const signedEvt = events.find(e => e.type === "signed");
    if (signedEvt?.type !== "signed") throw new Error("no signed event");
    const sigHex = signedEvt.signedOperation.signature;
    const sigBytes = Buffer.from(sigHex, "hex");
    expect(sigBytes).toHaveLength(64);

    const pubkey = Secp256k1.compressPubkey((await Secp256k1.makeKeypair(privkey)).pubkey);
    const recovered = Secp256k1Signature.fromFixedLength(sigBytes);
    const valid = await Secp256k1.verifySignature(recovered, sha256(expectedBytes), pubkey);
    expect(valid).toBe(true);
  });

  it("signs a wrapped (babylon epoching) delegate message", async () => {
    const signer = makeRealSigner();
    const transaction = makeSignDocJson(MSG_DELEGATE_WRAPPED);
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    const events = await firstValueFrom(
      signRawOperation({
        account: makeAccount(),
        deviceId: "mock",
        transaction,
      }).pipe(toArray()),
    );

    const signedEvt = events.find(e => e.type === "signed");
    if (signedEvt?.type !== "signed") throw new Error("no signed event");
    expect(Buffer.from(signedEvt.signedOperation.signature, "hex")).toHaveLength(64);
  });

  it("signs a multi-message batch", async () => {
    const signer = makeRealSigner();
    const transaction = makeSignDocJson([...MSG_SEND, ...MSG_DELEGATE_WRAPPED]);
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    const events = await firstValueFrom(
      signRawOperation({
        account: makeAccount(),
        deviceId: "mock",
        transaction,
      }).pipe(toArray()),
    );

    const signedEvt = events.find(e => e.type === "signed");
    if (signedEvt?.type !== "signed") throw new Error("no signed event");
    expect(Buffer.from(signedEvt.signedOperation.signature, "hex")).toHaveLength(64);
  });

  it("errors with UserRefusedOnDevice when the user rejects on device", async () => {
    const signer = {
      sign: jest.fn(async () => ({
        signature: null,
        return_code: RETURN_CODES.REFUSED_OPERATION,
      })),
    } as unknown as CosmosSigner;
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    await expect(
      firstValueFrom(
        signRawOperation({
          account: makeAccount(),
          deviceId: "mock",
          transaction: makeSignDocJson(MSG_SEND),
        }).pipe(toArray()),
      ),
    ).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("errors with ExpertModeRequired when the device demands expert mode", async () => {
    const signer = {
      sign: jest.fn(async () => ({
        signature: null,
        return_code: RETURN_CODES.EXPERT_MODE_REQUIRED,
      })),
    } as unknown as CosmosSigner;
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    await expect(
      firstValueFrom(
        signRawOperation({
          account: makeAccount(),
          deviceId: "mock",
          transaction: makeSignDocJson(MSG_SEND),
        }).pipe(toArray()),
      ),
    ).rejects.toBeInstanceOf(ExpertModeRequired);
  });

  it("throws a clear error when the device returns no signature on an unhandled return_code", async () => {
    const signer = {
      sign: jest.fn(async () => ({ signature: null, return_code: 0x6e00 })),
    } as unknown as CosmosSigner;
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    await expect(
      firstValueFrom(
        signRawOperation({
          account: makeAccount(),
          deviceId: "mock",
          transaction: makeSignDocJson(MSG_SEND),
        }).pipe(toArray()),
      ),
    ).rejects.toThrow("device returned no signature");
    expect(signer.sign).toHaveBeenCalledTimes(1);
  });

  it("passes the HRP as the 3rd sign arg for ethermint chains (coin type 60)", async () => {
    const signer = makeRealSigner();
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    await firstValueFrom(
      signRawOperation({
        account: makeAccount("44'/60'/0'/0/0"),
        deviceId: "mock",
        transaction: makeSignDocJson(MSG_SEND),
      }).pipe(toArray()),
    );

    // ethermint/60 → HRP (the cosmos chain prefix) is passed as the 3rd arg.
    expect(signer.sign.mock.calls[0][2]).toBe("cosmos");
  });

  it("rejects a malformed derivation path before any device interaction", async () => {
    const signer = makeRealSigner();
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    await expect(
      firstValueFrom(
        signRawOperation({
          account: makeAccount("not-a-path"),
          deviceId: "mock",
          transaction: makeSignDocJson(MSG_SEND),
        }).pipe(toArray()),
      ),
    ).rejects.toThrow("malformed derivation path");
    expect(signer.sign).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON before any device interaction", async () => {
    const signer = makeRealSigner();
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));

    await expect(
      firstValueFrom(
        signRawOperation({
          account: makeAccount(),
          deviceId: "mock",
          transaction: "not-json",
        }).pipe(toArray()),
      ),
    ).rejects.toThrow("not valid JSON");
    expect(signer.sign).not.toHaveBeenCalled();
  });

  it("rejects a signDoc with no messages", async () => {
    const signer = makeRealSigner();
    const signRawOperation = buildSignRawOperation(signerContextOf(signer));
    const transaction = makeSignDocJson([]);

    await expect(
      firstValueFrom(
        signRawOperation({ account: makeAccount(), deviceId: "mock", transaction }).pipe(toArray()),
      ),
    ).rejects.toThrow("non-empty array");
    expect(signer.sign).not.toHaveBeenCalled();
  });
});
