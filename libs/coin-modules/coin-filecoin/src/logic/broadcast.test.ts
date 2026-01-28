import { broadcast } from "./broadcast";
import { broadcastTx } from "../network/api";
import { TEST_TRANSACTION_HASHES, TEST_ADDRESSES } from "../test/fixtures";

jest.mock("../network/api");

const mockedBroadcastTx = broadcastTx as jest.MockedFunction<typeof broadcastTx>;

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast signed transaction and return hash", async () => {
    const signedTx = JSON.stringify({
      message: {
        version: 0,
        method: 0,
        nonce: 5,
        params: "",
        to: TEST_ADDRESSES.RECIPIENT_F1,
        from: TEST_ADDRESSES.F1_ADDRESS,
        gaslimit: 1000000,
        gaspremium: "50000",
        gasfeecap: "100000",
        value: "100000000000000000",
      },
      signature: {
        type: 1,
        data: "c2lnbmF0dXJlX2RhdGE=",
      },
    });

    mockedBroadcastTx.mockResolvedValueOnce({
      hash: TEST_TRANSACTION_HASHES.VALID,
    });

    const result = await broadcast(signedTx);

    expect(result).toBe(TEST_TRANSACTION_HASHES.VALID);
  });

  it("should pass correct request to broadcastTx", async () => {
    const signedTx = JSON.stringify({
      message: {
        version: 0,
        method: 0,
        nonce: 10,
        params: "",
        to: TEST_ADDRESSES.RECIPIENT_F1,
        from: TEST_ADDRESSES.F1_ADDRESS,
        gaslimit: 2000000,
        gaspremium: "100000",
        gasfeecap: "200000",
        value: "500000000000000000",
      },
      signature: {
        type: 1,
        data: "dGVzdF9zaWduYXR1cmU=",
      },
    });

    mockedBroadcastTx.mockResolvedValueOnce({
      hash: TEST_TRANSACTION_HASHES.VALID,
    });

    await broadcast(signedTx);

    expect(mockedBroadcastTx).toHaveBeenCalledWith({
      message: {
        version: 0,
        method: 0,
        nonce: 10,
        params: "",
        to: TEST_ADDRESSES.RECIPIENT_F1,
        from: TEST_ADDRESSES.F1_ADDRESS,
        gaslimit: 2000000,
        gaspremium: "100000",
        gasfeecap: "200000",
        value: "500000000000000000",
      },
      signature: {
        type: 1,
        data: "dGVzdF9zaWduYXR1cmU=",
      },
    });
  });

  it("should propagate broadcast errors", async () => {
    const signedTx = JSON.stringify({
      message: {
        version: 0,
        method: 0,
        nonce: 5,
        params: "",
        to: TEST_ADDRESSES.RECIPIENT_F1,
        from: TEST_ADDRESSES.F1_ADDRESS,
        gaslimit: 1000000,
        gaspremium: "50000",
        gasfeecap: "100000",
        value: "100000000000000000",
      },
      signature: {
        type: 1,
        data: "c2lnbmF0dXJlX2RhdGE=",
      },
    });

    mockedBroadcastTx.mockRejectedValueOnce(new Error("Broadcast failed"));

    await expect(broadcast(signedTx)).rejects.toThrow("Broadcast failed");
  });

  it("should handle token transfer broadcast", async () => {
    const signedTx = JSON.stringify({
      message: {
        version: 0,
        method: 3844450837,
        nonce: 15,
        params: "ZW5jb2RlZF9wYXJhbXM=",
        to: TEST_ADDRESSES.ERC20_CONTRACT,
        from: TEST_ADDRESSES.F4_ADDRESS,
        gaslimit: 3000000,
        gaspremium: "150000",
        gasfeecap: "300000",
        value: "0",
      },
      signature: {
        type: 1,
        data: "dG9rZW5fc2lnbmF0dXJl",
      },
    });

    mockedBroadcastTx.mockResolvedValueOnce({
      hash: TEST_TRANSACTION_HASHES.VALID,
    });

    const result = await broadcast(signedTx);

    expect(result).toBe(TEST_TRANSACTION_HASHES.VALID);
  });

  describe("error handling", () => {
    it("should throw for malformed JSON input", async () => {
      const malformedJson = "not valid json {";

      await expect(broadcast(malformedJson)).rejects.toThrow(
        "Invalid signed transaction: malformed JSON",
      );
    });

    it("should throw for missing message field", async () => {
      const noMessage = JSON.stringify({
        signature: {
          type: 1,
          data: "c2lnbmF0dXJlX2RhdGE=",
        },
        // missing message
      });

      await expect(broadcast(noMessage)).rejects.toThrow(
        "Invalid signed transaction: missing message or signature",
      );
    });

    it("should throw for missing signature field", async () => {
      const noSignature = JSON.stringify({
        message: {
          version: 0,
          method: 0,
          nonce: 5,
          params: "",
          to: TEST_ADDRESSES.RECIPIENT_F1,
          from: TEST_ADDRESSES.F1_ADDRESS,
          gaslimit: 1000000,
          gaspremium: "50000",
          gasfeecap: "100000",
          value: "100000000000000000",
        },
        // missing signature
      });

      await expect(broadcast(noSignature)).rejects.toThrow(
        "Invalid signed transaction: missing message or signature",
      );
    });
  });
});
