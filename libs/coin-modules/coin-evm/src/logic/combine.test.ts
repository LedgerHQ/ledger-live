import { utils, Wallet } from "ethers";
import { combine } from "./combine";

describe("combine", () => {
  it("should combine a serialized unsigned tx and a signature to produce a signed tx", () => {
    const wallet = Wallet.createRandom();

    const unsignedTx = {
      to: wallet.address,
      value: 1,
      nonce: 0,
      gasLimit: 21000,
      gasPrice: 1,
      chainId: 1,
    };

    const serializedUnsignedTx = utils.serializeTransaction(unsignedTx);

    const signature = wallet._signingKey().signDigest(utils.keccak256(serializedUnsignedTx));
    const signatureHex = utils.joinSignature(signature);

    const signedTx = combine(serializedUnsignedTx, signatureHex);

    const parsedTx = utils.parseTransaction(signedTx);
    expect(parsedTx.from).toBe(wallet.address);
    expect(parsedTx.to).toBe(wallet.address);
    expect(parsedTx.value.toString()).toBe("1");
  });

  it("should combine a transaction object and signature object", () => {
    const wallet = Wallet.createRandom();

    const unsignedTx = {
      to: wallet.address,
      value: 2,
      nonce: 1,
      gasLimit: 21000,
      gasPrice: 2,
      chainId: 1,
    };

    const serializedUnsignedTx = utils.serializeTransaction(unsignedTx);
    const parsedTx = utils.parseTransaction(serializedUnsignedTx);

    const signature = wallet._signingKey().signDigest(utils.keccak256(serializedUnsignedTx));

    const signedTx = combine(parsedTx, signature);

    const parsedSignedTx = utils.parseTransaction(signedTx);
    expect(parsedSignedTx.from).toBe(wallet.address);
    expect(parsedSignedTx.value.toString()).toBe("2");
    expect(parsedSignedTx.nonce).toBe(1);
  });

  it("should combine a signature object and string tx", () => {
    const wallet = Wallet.createRandom();

    const unsignedTx = {
      to: wallet.address,
      value: 3,
      nonce: 2,
      gasLimit: 21000,
      gasPrice: 3,
      chainId: 1,
    };

    const serializedUnsignedTx = utils.serializeTransaction(unsignedTx);
    const signature = wallet._signingKey().signDigest(utils.keccak256(serializedUnsignedTx));

    const signedTx = combine(serializedUnsignedTx, signature);

    const parsedSignedTx = utils.parseTransaction(signedTx);
    expect(parsedSignedTx.from).toBe(wallet.address);
    expect(parsedSignedTx.value.toString()).toBe("3");
    expect(parsedSignedTx.nonce).toBe(2);
  });

  it("should throw if signature is invalid", () => {
    const unsignedTx = {
      to: "0x0000000000000000000000000000000000000000",
      value: 1,
      nonce: 0,
      gasLimit: 21000,
      gasPrice: 1,
      chainId: 1,
    };
    const serializedUnsignedTx = utils.serializeTransaction(unsignedTx);

    expect(() => {
      combine(serializedUnsignedTx, "0x1234");
    }).toThrow();
  });
});
