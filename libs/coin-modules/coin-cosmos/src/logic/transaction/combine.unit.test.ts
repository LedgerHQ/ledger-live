import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { combine } from "./combine";
import { CosmosCraftedTransaction } from "./craftTransaction";

const payload: CosmosCraftedTransaction = {
  protoMsgs: [
    { typeUrl: "/cosmos.bank.v1beta1.MsgSend", value: Buffer.from([]).toString("base64") },
  ],
  memo: "",
  pubKeyType: "/cosmos.crypto.secp256k1.PubKey",
  feeAmount: [{ denom: "uatom", amount: "500" }],
  gasLimit: "200000",
  sequence: "3",
  accountNumber: "7",
  chainId: "cosmoshub-4",
  signable: "",
};

describe("logic/transaction/combine", () => {
  it("assembles a decodable protobuf TxRaw from crafted tx, signature and pubkey", () => {
    const signatureHex = "11".repeat(64); // 64-byte fixed-length r‖s
    const pubkeyBase64 = Buffer.from(new Uint8Array(33).fill(2)).toString("base64");

    const hex = combine(JSON.stringify(payload), signatureHex, pubkeyBase64);
    const decoded = TxRaw.decode(Uint8Array.from(Buffer.from(hex, "hex")));

    expect(decoded.signatures).toHaveLength(1);
    expect(decoded.signatures[0]).toHaveLength(64);
    expect(decoded.bodyBytes.length).toBeGreaterThan(0);
    expect(decoded.authInfoBytes.length).toBeGreaterThan(0);
  });

  it("throws when the public key is missing", () => {
    expect(() => combine(JSON.stringify(payload), "11".repeat(64))).toThrow("public key");
  });

  it("throws on a non-hex or wrong-length signature", () => {
    const pubkeyBase64 = Buffer.from(new Uint8Array(33).fill(2)).toString("base64");
    expect(() => combine(JSON.stringify(payload), "zz".repeat(64), pubkeyBase64)).toThrow(
      "64-byte",
    );
    expect(() => combine(JSON.stringify(payload), "11".repeat(20), pubkeyBase64)).toThrow(
      "64-byte",
    );
  });
});
