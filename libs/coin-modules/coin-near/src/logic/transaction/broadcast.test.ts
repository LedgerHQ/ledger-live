import { broadcastTransaction } from "../../network";
import { broadcast } from "./broadcast";

jest.mock("../../network", () => ({ broadcastTransaction: jest.fn() }));

const SIGNED_TX = "ZmFrZS1zaWduZWQtdHg=";
const HASH = "GkQ7Uh8oPPGtVfyPz1yLKmqPqZ8ZyxvGtN5MmYq8mF1w";

describe("broadcast", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits the signed transaction and returns its hash", async () => {
    (broadcastTransaction as jest.Mock).mockResolvedValue(HASH);

    await expect(broadcast(SIGNED_TX)).resolves.toBe(HASH);
    expect(broadcastTransaction).toHaveBeenCalledWith(SIGNED_TX);
  });

  it("propagates a node error", async () => {
    (broadcastTransaction as jest.Mock).mockRejectedValue(
      new Error("INVALID_TRANSACTION: nonce too small"),
    );

    await expect(broadcast(SIGNED_TX)).rejects.toThrow("nonce too small");
  });
});
