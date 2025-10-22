import { PublicKey } from "@hashgraph/sdk";
import { combine } from "./combine";
import { deserializeSignature, deserializeTransaction, serializeTransaction } from "./utils";

jest.mock("./utils");
jest.mock("@hashgraph/sdk");

describe("combine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should combine transaction with signature successfully", () => {
    const tx = "serialized-transaction";
    const signature = "serialized-signature";
    const publicKey = "public-key-string";

    const mockDeserializedTx = { addSignature: jest.fn() } as any;
    const mockBufferSignature = Buffer.from("mock-signature");
    const mockBufferPublicKey = { key: "mock-public-key" } as any;
    const mockSerializedTxWithSignature = "serialized-transaction-with-signature";

    (deserializeTransaction as jest.Mock).mockReturnValue(mockDeserializedTx);
    (deserializeSignature as jest.Mock).mockReturnValue(mockBufferSignature);
    (PublicKey.fromString as jest.Mock).mockReturnValue(mockBufferPublicKey);
    (serializeTransaction as jest.Mock).mockReturnValue(mockSerializedTxWithSignature);

    const result = combine(tx, signature, publicKey);

    expect(deserializeTransaction).toHaveBeenCalledTimes(1);
    expect(deserializeTransaction).toHaveBeenCalledWith(tx);
    expect(deserializeSignature).toHaveBeenCalledTimes(1);
    expect(deserializeSignature).toHaveBeenCalledWith(signature);
    expect(PublicKey.fromString).toHaveBeenCalledTimes(1);
    expect(PublicKey.fromString).toHaveBeenCalledWith(publicKey);
    expect(mockDeserializedTx.addSignature).toHaveBeenCalledTimes(1);
    expect(mockDeserializedTx.addSignature).toHaveBeenCalledWith(
      mockBufferPublicKey,
      mockBufferSignature,
    );
    expect(serializeTransaction).toHaveBeenCalledTimes(1);
    expect(serializeTransaction).toHaveBeenCalledWith(mockDeserializedTx);
    expect(result).toBe(mockSerializedTxWithSignature);
  });

  it("should throw an error when public key is not provided", () => {
    const tx = "serialized-transaction";
    const signature = "serialized-signature";

    expect(() => combine(tx, signature, undefined)).toThrow();
    expect(deserializeTransaction).not.toHaveBeenCalled();
    expect(deserializeSignature).not.toHaveBeenCalled();
    expect(PublicKey.fromString).not.toHaveBeenCalled();
    expect(serializeTransaction).not.toHaveBeenCalled();
  });

  it("should propagate errors from deserializeTransaction", () => {
    const tx = "serialized-transaction";
    const signature = "serialized-signature";
    const publicKey = "public-key-string";
    const error = new Error("Deserialization error");

    (deserializeTransaction as jest.Mock).mockImplementation(() => {
      throw error;
    });

    expect(() => combine(tx, signature, publicKey)).toThrow(error);
    expect(deserializeTransaction).toHaveBeenCalledTimes(1);
    expect(deserializeTransaction).toHaveBeenCalledWith(tx);
    expect(deserializeSignature).not.toHaveBeenCalled();
    expect(PublicKey.fromString).not.toHaveBeenCalled();
    expect(serializeTransaction).not.toHaveBeenCalled();
  });

  it("should propagate errors from deserializeSignature", () => {
    const tx = "serialized-transaction";
    const signature = "serialized-signature";
    const publicKey = "public-key-string";
    const mockDeserializedTx = { addSignature: jest.fn() } as any;
    const error = new Error("Signature deserialization error");

    (deserializeTransaction as jest.Mock).mockReturnValue(mockDeserializedTx);
    (deserializeSignature as jest.Mock).mockImplementation(() => {
      throw error;
    });

    expect(() => combine(tx, signature, publicKey)).toThrow(error);
    expect(deserializeTransaction).toHaveBeenCalledTimes(1);
    expect(deserializeTransaction).toHaveBeenCalledWith(tx);
    expect(deserializeSignature).toHaveBeenCalledTimes(1);
    expect(deserializeSignature).toHaveBeenCalledWith(signature);
    expect(PublicKey.fromString).not.toHaveBeenCalled();
    expect(serializeTransaction).not.toHaveBeenCalled();
  });

  it("should propagate errors from PublicKey.fromString", () => {
    const tx = "serialized-transaction";
    const signature = "serialized-signature";
    const publicKey = "invalid-public-key";
    const mockDeserializedTx = { addSignature: jest.fn() } as any;
    const mockBufferSignature = Buffer.from("mock-signature");
    const error = new Error("Invalid public key");

    (deserializeTransaction as jest.Mock).mockReturnValue(mockDeserializedTx);
    (deserializeSignature as jest.Mock).mockReturnValue(mockBufferSignature);
    (PublicKey.fromString as jest.Mock).mockImplementation(() => {
      throw error;
    });

    expect(() => combine(tx, signature, publicKey)).toThrow(error);
    expect(deserializeTransaction).toHaveBeenCalledTimes(1);
    expect(deserializeTransaction).toHaveBeenCalledWith(tx);
    expect(deserializeSignature).toHaveBeenCalledTimes(1);
    expect(deserializeSignature).toHaveBeenCalledWith(signature);
    expect(PublicKey.fromString).toHaveBeenCalledTimes(1);
    expect(PublicKey.fromString).toHaveBeenCalledWith(publicKey);
    expect(serializeTransaction).not.toHaveBeenCalled();
  });
});
