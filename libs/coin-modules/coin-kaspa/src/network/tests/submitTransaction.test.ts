import { submitTransaction } from "../index";

describe("submitTransaction function", () => {
  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    jest.clearAllMocks();
  });
  it("Gets information about addresses being active or not", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactionId: "396f29c47bdd95dddbe868203ce905535a3de1b48af7adeb40b769662885c008",
      }),
    });
    const transactionDetails = {
      dummy: "data",
    };
    const result = await submitTransaction(JSON.stringify(transactionDetails));

    const expectedResult = {
      txId: "396f29c47bdd95dddbe868203ce905535a3de1b48af7adeb40b769662885c008",
    };

    expect(result).toEqual(expectedResult);
  });

  it("Throws an error if the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const transactionDetails = {
      dummy: "data",
    };

    await expect(submitTransaction(JSON.stringify(transactionDetails))).rejects.toThrow(
      "Failed to submit transaction. Status: 500",
    );
  });

  it("Throws an error if there is an exception while submitting", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    const transactionDetails = {
      dummy: "data",
    };

    await expect(submitTransaction(JSON.stringify(transactionDetails))).rejects.toThrow(
      "Error submitting transaction: Error: Network error",
    );
  });
});
