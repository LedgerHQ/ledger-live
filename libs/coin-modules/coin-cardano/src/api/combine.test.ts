import { type CardanoConfig } from "../config";
import { combine } from "../logic/combine";
import { createApi } from ".";

jest.mock("../logic/combine", () => ({
  combine: jest.fn(),
}));

const mockCombine = jest.mocked(combine);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("api.combine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the combine logic and returns the signed payload", () => {
    mockCombine.mockReturnValue("signedTxPayload");
    const api = createApi(config, "cardano");

    const result = api.combine("unsignedTx", "signature", "pubkey");

    expect(mockCombine).toHaveBeenCalledTimes(1);
    expect(mockCombine).toHaveBeenCalledWith("unsignedTx", "signature", "pubkey");
    expect(result).toBe("signedTxPayload");
  });

  it("propagates errors thrown by the combine logic", () => {
    mockCombine.mockImplementation(() => {
      throw new Error("cardano: combine requires the signing public key");
    });
    const api = createApi(config, "cardano");

    expect(() => api.combine("unsignedTx", "signature")).toThrow(
      "cardano: combine requires the signing public key",
    );
  });
});
