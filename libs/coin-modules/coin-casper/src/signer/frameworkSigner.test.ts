import { Transaction } from "casper-js-sdk";
import { combine } from "../logic/combine";
import { createMockSignedTransaction } from "../__tests__/fixtures/transaction.fixture";
import { CasperGetAddrResponse, CasperSignature, CasperSigner } from "../types";
import { createFrameworkSigner } from "./frameworkSigner";

const addrResponse = (overrides: Partial<CasperGetAddrResponse> = {}): CasperGetAddrResponse => ({
  errorMessage: "No errors",
  returnCode: 0x9000,
  publicKey: Buffer.from("aabbcc", "hex"),
  Address: "",
  ...overrides,
});

const signResponse = (signatureRS: Buffer): CasperSignature => ({
  errorMessage: "No errors",
  returnCode: 0x9000,
  signatureRS,
  signatureRSV: Buffer.alloc(0),
  signature_compact: new Uint8Array(),
});

const makeSigner = (overrides: Partial<CasperSigner> = {}): CasperSigner => ({
  showAddressAndPubKey: jest.fn().mockResolvedValue(addrResponse()),
  getAddressAndPubKey: jest.fn().mockResolvedValue(addrResponse()),
  sign: jest.fn().mockResolvedValue(signResponse(Buffer.alloc(64, 0xab))),
  ...overrides,
});

describe("createFrameworkSigner.getAddress", () => {
  it("reads silently via getAddressAndPubKey when verify is not requested", async () => {
    const device = makeSigner();
    const framework = createFrameworkSigner(device);

    await framework.getAddress("m/44'/506'/0'/0/0");

    expect(device.getAddressAndPubKey).toHaveBeenCalledTimes(1);
    expect(device.getAddressAndPubKey).toHaveBeenCalledWith("m/44'/506'/0'/0/0");
    expect(device.showAddressAndPubKey).not.toHaveBeenCalled();
  });

  it("confirms on device via showAddressAndPubKey when verify is true", async () => {
    const device = makeSigner();
    const framework = createFrameworkSigner(device);

    await framework.getAddress("m/44'/506'/0'/0/0", { verify: true });

    expect(device.showAddressAndPubKey).toHaveBeenCalledTimes(1);
    expect(device.showAddressAndPubKey).toHaveBeenCalledWith("m/44'/506'/0'/0/0");
    expect(device.getAddressAndPubKey).not.toHaveBeenCalled();
  });

  it("returns the device address lowercased, as both address and public key", async () => {
    const device = makeSigner({
      getAddressAndPubKey: jest
        .fn()
        .mockResolvedValue(
          addrResponse({ Address: "02ABCDEF", publicKey: Buffer.from("00112233", "hex") }),
        ),
    });
    const framework = createFrameworkSigner(device);

    const result = await framework.getAddress("m/44'/506'/0'/0/0");

    expect(result).toEqual({
      path: "m/44'/506'/0'/0/0",
      address: "02abcdef",
      publicKey: "02abcdef",
    });
  });

  it("derives the address from the public key with the secp256k1 tag when the device omits it", async () => {
    const device = makeSigner({
      getAddressAndPubKey: jest
        .fn()
        .mockResolvedValue(
          addrResponse({ Address: "", publicKey: Buffer.from("00112233", "hex") }),
        ),
    });
    const framework = createFrameworkSigner(device);

    const result = await framework.getAddress("m/44'/506'/0'/0/0");

    expect(result.address).toBe("0200112233");
    expect(result.publicKey).toBe("0200112233");
  });
});

describe("createFrameworkSigner.signTransaction", () => {
  it("signs the bytes of the crafted transaction, not the JSON string", async () => {
    const { unsignedTx, untaggedSignature } = createMockSignedTransaction();
    const sign = jest.fn().mockResolvedValue(signResponse(Buffer.from(untaggedSignature, "hex")));
    const framework = createFrameworkSigner(makeSigner({ sign }));

    await framework.signTransaction("m/44'/506'/0'/0/0", unsignedTx);

    expect(sign).toHaveBeenCalledWith(
      "m/44'/506'/0'/0/0",
      Buffer.from(Transaction.fromJSON(unsignedTx).toBytes()),
    );
  });

  it("prepends the secp256k1 tag byte, producing a 130-char signature combine accepts", async () => {
    const { unsignedTx, untaggedSignature, taggedSignature } = createMockSignedTransaction();
    const sign = jest.fn().mockResolvedValue(signResponse(Buffer.from(untaggedSignature, "hex")));
    const framework = createFrameworkSigner(makeSigner({ sign }));

    const signature = await framework.signTransaction("m/44'/506'/0'/0/0", unsignedTx);

    expect(signature).toHaveLength(130);
    expect(signature).toBe(taggedSignature);
  });

  it("combines the signature with the public key getAddress returned", async () => {
    const { unsignedTx, untaggedSignature, publicKey } = createMockSignedTransaction();
    const device = makeSigner({
      // The device returns the untagged key body.
      getAddressAndPubKey: jest
        .fn()
        .mockResolvedValue(
          addrResponse({ Address: "", publicKey: Buffer.from(publicKey.slice(2), "hex") }),
        ),
      sign: jest.fn().mockResolvedValue(signResponse(Buffer.from(untaggedSignature, "hex"))),
    });
    const framework = createFrameworkSigner(device);

    const address = await framework.getAddress("m/44'/506'/0'/0/0");
    const signature = await framework.signTransaction("m/44'/506'/0'/0/0", unsignedTx);

    const combined = combine(unsignedTx, [signature], address.publicKey);
    expect(() => Transaction.fromJSON(combined)).not.toThrow();
  });
});
