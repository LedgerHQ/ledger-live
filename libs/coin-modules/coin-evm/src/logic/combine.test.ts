import { ethers, SigningKey, Wallet } from "ethers";
import { combine } from "./combine";

describe("combine", () => {
  const privateKey = "0xb40eddd40b507adb0df9d44fe668a12c7d43d75bb0a3fc46cdaba1fe46dede2d";

  it("should combine a serialized unsigned tx and a signature to produce a signed tx", () => {
    const wallet = Wallet.createRandom();

    const unsignedTx = {
      to: wallet.address,
      value: BigInt(1),
      gasLimit: BigInt(21000),
      nonce: 0,
      chainId: BigInt(1),
      type: 0,
      gasPrice: BigInt(1),
    } as Partial<ethers.Transaction>;

    const serializedUnsignedTx = ethers.Transaction.from(unsignedTx).unsignedSerialized;

    const signingKey = new SigningKey(privateKey);
    const signature = signingKey.sign(ethers.keccak256(serializedUnsignedTx));
    const signatureHex = ethers.Signature.from(signature).serialized;

    const signedTx = combine(serializedUnsignedTx, signatureHex);

    const parsedTx = ethers.Transaction.from(signedTx);

    expect(parsedTx.from).toBe(
      ethers.recoverAddress(ethers.keccak256(serializedUnsignedTx), signature),
    );
    expect(parsedTx.to).toBe(wallet.address);
    expect(parsedTx.value.toString()).toBe("1");
  });

  it("should combine a transaction object and signature object", () => {
    const wallet = Wallet.createRandom();

    const unsignedTx = {
      to: wallet.address,
      value: BigInt(2),
      nonce: 1,
      gasLimit: BigInt(21000),
      gasPrice: BigInt(2),
      chainId: BigInt(1),
    };

    const serializedUnsignedTx = ethers.Transaction.from(unsignedTx).unsignedSerialized;
    const parsedTx = ethers.Transaction.from(serializedUnsignedTx);

    const signingKey = new SigningKey(privateKey);
    const signature = signingKey.sign(ethers.keccak256(serializedUnsignedTx));

    const signedTx = combine(parsedTx, signature);

    const parsedSignedTx = ethers.Transaction.from(signedTx);
    expect(parsedSignedTx.from).toBe(
      ethers.recoverAddress(ethers.keccak256(serializedUnsignedTx), signature),
    );
    expect(parsedSignedTx.value.toString()).toBe("2");
    expect(parsedSignedTx.nonce).toBe(1);
  });

  it("should combine a signature object and string tx", () => {
    const wallet = Wallet.createRandom();

    const unsignedTx = {
      to: wallet.address,
      value: BigInt(3),
      nonce: 2,
      gasLimit: BigInt(21000),
      gasPrice: BigInt(3),
      chainId: BigInt(1),
    };

    const serializedUnsignedTx = ethers.Transaction.from(unsignedTx).unsignedSerialized;

    const signingKey = new SigningKey(privateKey);
    const signature = signingKey.sign(ethers.keccak256(serializedUnsignedTx));

    const signedTx = combine(serializedUnsignedTx, signature);

    const parsedSignedTx = ethers.Transaction.from(signedTx);
    expect(parsedSignedTx.from).toBe(
      ethers.recoverAddress(ethers.keccak256(serializedUnsignedTx), signature),
    );
    expect(parsedSignedTx.value.toString()).toBe("3");
    expect(parsedSignedTx.nonce).toBe(2);
  });

  it("should throw if signature is invalid", () => {
    const unsignedTx = {
      to: "0x0000000000000000000000000000000000000000",
      value: BigInt(1),
      nonce: 0,
      gasLimit: BigInt(21000),
      gasPrice: BigInt(1),
      chainId: BigInt(1),
    };
    const serializedUnsignedTx = ethers.Transaction.from(unsignedTx).unsignedSerialized;

    expect(() => {
      combine(serializedUnsignedTx, "0x1234");
    }).toThrow();
  });
});
