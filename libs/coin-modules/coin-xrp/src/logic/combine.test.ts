import { decode, encode } from "ripple-binary-codec";
import { SignerEntry } from "../types";
import { combine } from "./combine";

type DecodedTx = {
  SigningPubKey?: string;
  TxnSignature?: string;
  Signers?: SignerEntry[];
};

function signerEntry(account: string, signingPubKey: string, txnSignature = ""): SignerEntry {
  return {
    Signer: {
      Account: account,
      SigningPubKey: signingPubKey,
      TxnSignature: txnSignature,
    },
  };
}

describe("combine", () => {
  const sender = "rPDf6SQStnNmw1knCu1ei7h6BcDAEUUqn5";
  const destination = "rJe1St1G6BWMFmdrrcT7NdD3XT1NxTMEWN";
  const signer1 = "rDKsbvy9uaNpPtvVFraJyNGfjvTw8xivgK";
  const signer2 = "r94uo44ukDHWVjYDJLZJYwDdZjo1F2QYgq";
  const signer3 = sender;
  const pubKey1 = "ED0123456789ABCDEFFEDCBA98765432100123456789ABCDEFFEDCBA9876543211";
  const pubKey2 = "EDFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
  const pubKey3 = "EDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  it("fills the first empty multi-sign signer signature when no public key is provided", () => {
    const tx = encode({
      TransactionType: "Payment",
      Account: sender,
      Amount: "10",
      Destination: destination,
      SigningPubKey: "",
      Signers: [
        signerEntry(signer1, pubKey1, ""),
        signerEntry(signer2, pubKey2, ""),
        signerEntry(signer3, pubKey3, "DEADBEEF"),
      ],
    });

    const combined = combine(tx, "A1B2");
    const decoded = decode(combined) as DecodedTx;

    expect(decoded.Signers?.[0]?.Signer.TxnSignature).toBe("A1B2");
    expect(decoded.Signers?.[1]?.Signer.TxnSignature).toBe("");
    expect(decoded.Signers?.[2]?.Signer.TxnSignature).toBe("DEADBEEF");
  });

  it("fills the matching multi-sign signer signature when public key is provided", () => {
    const tx = encode({
      TransactionType: "Payment",
      Account: sender,
      Amount: "10",
      Destination: destination,
      SigningPubKey: "",
      Signers: [signerEntry(signer1, pubKey1, ""), signerEntry(signer2, pubKey2, "")],
    });

    const combined = combine(tx, "B2C3", pubKey2);
    const decoded = decode(combined) as DecodedTx;

    expect(decoded.Signers?.[0]?.Signer.TxnSignature).toBe("");
    expect(decoded.Signers?.[1]?.Signer.TxnSignature).toBe("B2C3");
  });

  it("sets TxnSignature and missing SigningPubKey for single-sign transactions", () => {
    const tx = encode({
      TransactionType: "Payment",
      Account: sender,
      Amount: "10",
      Destination: destination,
    });

    const combined = combine(tx, "C3D4", pubKey1);
    const decoded = decode(combined) as DecodedTx;

    expect(decoded.TxnSignature).toBe("C3D4");
    expect(decoded.SigningPubKey).toBe(pubKey1);
  });

  it("does not overwrite existing SigningPubKey for single-sign transactions", () => {
    const tx = encode({
      TransactionType: "Payment",
      Account: sender,
      Amount: "10",
      Destination: destination,
      SigningPubKey: pubKey2,
    });

    const combined = combine(tx, "D4E5", pubKey3);
    const decoded = decode(combined) as DecodedTx;

    expect(decoded.TxnSignature).toBe("D4E5");
    expect(decoded.SigningPubKey).toBe(pubKey2);
  });
});
