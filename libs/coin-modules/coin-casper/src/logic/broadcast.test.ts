import { createMockContext } from "../__tests__/fixtures/config.fixture";
import { createMockSignedTransaction } from "../__tests__/fixtures/transaction.fixture";
import { broadcastTx } from "../network/api";
import { combine } from "./combine";
import { broadcast } from "./broadcast";

jest.mock("../network/api", () => ({
  broadcastTx: jest.fn(),
}));

const mockBroadcastTx = jest.mocked(broadcastTx);
const context = createMockContext();

describe("broadcast", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the hash from putTransaction for a valid signed transaction", async () => {
    const { unsignedTx, taggedSignature, publicKey } = createMockSignedTransaction();
    const combinedTx = combine(unsignedTx, [taggedSignature], publicKey);

    mockBroadcastTx.mockResolvedValueOnce("mockedTxHash");

    const result = await broadcast(context, combinedTx);

    expect(broadcastTx).toHaveBeenCalledTimes(1);
    expect(result).toBe("mockedTxHash");
  });

  it("propagates a node rejection unchanged", async () => {
    const { unsignedTx, taggedSignature, publicKey } = createMockSignedTransaction();
    const combinedTx = combine(unsignedTx, [taggedSignature], publicKey);
    const nodeError = new Error("Code: -32016, err: Invalid transaction");

    mockBroadcastTx.mockRejectedValueOnce(nodeError);

    await expect(broadcast(context, combinedTx)).rejects.toBe(nodeError);
  });

  it("throws on malformed JSON before reaching the network", async () => {
    await expect(broadcast(context, "not-json")).rejects.toThrow(
      /The JSON can't be parsed as a Transaction/,
    );
    expect(broadcastTx).not.toHaveBeenCalled();
  });
});
