import { submitTransaction } from "../../network";
import { broadcast } from "./broadcast";

const mockSubmitTransaction = jest.fn();
jest.mock("../../network", () => ({
  ...jest.requireActual("../../network"),
  submitTransaction: (...args: unknown[]) => mockSubmitTransaction(...args),
}));

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the transaction hash on success", async () => {
    mockSubmitTransaction.mockResolvedValue({ txId: "abc123" });

    const hash = await broadcast('{"transaction":{}}');

    expect(mockSubmitTransaction).toHaveBeenCalledWith('{"transaction":{}}');
    expect(hash).toBe("abc123");
  });

  it("throws when the response has an empty transaction id", async () => {
    mockSubmitTransaction.mockResolvedValue({ txId: "" });

    await expect(broadcast('{"transaction":{}}')).rejects.toThrow(
      "kaspa: broadcast returned no transaction id",
    );
  });

  it("throws when the response is missing the transaction id", async () => {
    mockSubmitTransaction.mockResolvedValue({} as { txId: string });

    await expect(broadcast('{"transaction":{}}')).rejects.toThrow(
      "kaspa: broadcast returned no transaction id",
    );
  });

  it("propagates submit errors", async () => {
    mockSubmitTransaction.mockRejectedValue(new Error("kaspa: broadcast failed with status 500"));

    await expect(broadcast('{"transaction":{}}')).rejects.toThrow("status 500");
  });
});
