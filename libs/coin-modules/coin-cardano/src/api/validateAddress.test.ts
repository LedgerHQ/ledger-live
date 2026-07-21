import { createApi } from ".";
import { type CardanoConfig } from "../config";
import { validateAddress } from "../logic/validateAddress";

jest.mock("../logic/validateAddress");
const mockValidateAddress = jest.mocked(validateAddress);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("validateAddress", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([true, false])("delegates to logic validateAddress and returns %s", async expected => {
    mockValidateAddress.mockResolvedValue(expected);

    const api = createApi(config, "cardano");
    const result = await api.validateAddress("addr1...", {});

    expect(result).toBe(expected);
    expect(mockValidateAddress).toHaveBeenCalledWith("addr1...", {});
  });

  it("propagates errors from logic validateAddress", async () => {
    mockValidateAddress.mockRejectedValue(new Error("boom"));

    const api = createApi(config, "cardano");

    await expect(api.validateAddress("addr1...", {})).rejects.toThrow("boom");
  });
});
