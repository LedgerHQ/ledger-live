import { broadcast } from "./broadcast";

const mockSubmit = jest.fn();
jest.mock("../network", () => ({
  submit: (arg: unknown) => mockSubmit(arg),
}));

describe("broadcast", () => {
  afterEach(() => {
    mockSubmit.mockClear();
  });

  it.each(["tesSUCCESS", "terQUEUED"])(
    "returns the transaction hash when succeesseed",
    async networkResult => {
      // Given
      const signature = "SIGNATURE";
      mockSubmit.mockResolvedValue({
        engine_result: networkResult,
        engine_result_message: "Whatever",
        tx_json: {
          hash: "HASH_TX_JSON",
        },
      });

      // When
      const result = await broadcast(signature);

      // Then
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit.mock.lastCall[0]).toEqual(signature);
      expect(result).toEqual("HASH_TX_JSON");
    },
  );

  it("throws an error if 'engine_result' different from tesSUCCESS or terQUEUED", async () => {
    // Given
    const signature = "SIGNATURE";
    const networkResultMessage = "Failed";
    mockSubmit.mockResolvedValue({
      engine_result: "",
      engine_result_message: networkResultMessage,
      tx_json: {
        hash: "HASH_WHATEVER",
      },
    });

    // When & Then
    await expect(broadcast(signature)).rejects.toThrow(new Error(networkResultMessage));

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit.mock.lastCall[0]).toEqual(signature);
  });
});
