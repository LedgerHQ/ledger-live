import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { type CardanoConfig } from "../config";
import { getValidators } from "../logic/getValidators";
import { createApi } from ".";

jest.mock("../logic/getValidators", () => ({
  getValidators: jest.fn(),
}));

const mockGetValidators = jest.mocked(getValidators);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const currency = getCryptoCurrencyById("cardano");

describe("api.getValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the getValidators logic with the resolved currency", async () => {
    const page = { items: [], next: undefined };
    mockGetValidators.mockResolvedValue(page);
    const api = createApi(config, "cardano");

    const result = await api.getValidators();

    expect(mockGetValidators).toHaveBeenCalledTimes(1);
    expect(mockGetValidators).toHaveBeenCalledWith(currency);
    expect(result).toBe(page);
  });

  it("propagates errors thrown by the getValidators logic", async () => {
    mockGetValidators.mockRejectedValue(new Error("pool list fetch failed"));
    const api = createApi(config, "cardano");

    await expect(api.getValidators()).rejects.toThrow("pool list fetch failed");
  });
});
