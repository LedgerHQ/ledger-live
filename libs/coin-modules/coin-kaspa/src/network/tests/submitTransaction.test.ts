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
      text: async () => "",
    });

    const transactionDetails = {
      dummy: "data",
    };

    await expect(submitTransaction(JSON.stringify(transactionDetails))).rejects.toThrow(
      "kaspa: broadcast failed with status 500",
    );
  });

  it("Throws an error if there is an exception while submitting", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    const transactionDetails = {
      dummy: "data",
    };

    await expect(submitTransaction(JSON.stringify(transactionDetails))).rejects.toThrow(
      "Network error",
    );
  });

  it("Includes the node's reason in the error when it sends one", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "transaction is an orphan",
    });

    await expect(submitTransaction(JSON.stringify({ dummy: "data" }))).rejects.toThrow(
      "kaspa: broadcast failed with status 400: transaction is an orphan",
    );
  });

  it("Still reports the status when the error body cannot be read", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => {
        throw new Error("body stream already read");
      },
    });

    await expect(submitTransaction(JSON.stringify({ dummy: "data" }))).rejects.toThrow(
      /^kaspa: broadcast failed with status 400$/,
    );
  });

  describe("retries", () => {
    const txId = "396f29c47bdd95dddbe868203ce905535a3de1b48af7adeb40b769662885c008";

    afterEach(() => {
      jest.useRealTimers();
    });

    it("waits out a 429 (not yet handled by the node) and broadcasts once", async () => {
      jest.useFakeTimers();
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 429, text: async () => "Too Many Requests" })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ transactionId: txId }),
        });

      const promise = submitTransaction(JSON.stringify({ dummy: "data" }));
      await jest.advanceTimersByTimeAsync(1_000);

      await expect(promise).resolves.toEqual({ txId });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("never retries a 5xx — the transaction may already have been broadcast", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "" });

      await expect(submitTransaction(JSON.stringify({ dummy: "data" }))).rejects.toThrow(
        "kaspa: broadcast failed with status 503",
      );
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("never retries a network error — the transaction may already have been broadcast", async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));

      await expect(submitTransaction(JSON.stringify({ dummy: "data" }))).rejects.toThrow(
        "fetch failed",
      );
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
