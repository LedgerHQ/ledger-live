import { getValidators } from "../logic";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getPreloadStrategy, hydrate, preload, PRELOAD_MAX_AGE } from "./preload";

jest.mock("../logic", () => ({
  getValidators: Object.assign(jest.fn(), { hydrate: jest.fn() }),
}));

const mockGetValidators = jest.mocked(getValidators);
const mockCurrency = getMockedCurrency();

const VALIDATOR = {
  address: "aleo1l2a3lakq9pz9w9hyre7rk9zmk64wzr62z0q26wglr8tmf8w5cyqqxtt364",
  name: "Open Validator",
  stake: 3000,
  isOpen: true,
  commission: 5,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getPreloadStrategy", () => {
  it("exposes preloadMaxAge matching the validators cache TTL", () => {
    expect(getPreloadStrategy()).toEqual({ preloadMaxAge: PRELOAD_MAX_AGE });
  });
});

describe("preload", () => {
  it("warms the getValidators cache for the given currency and returns the list", async () => {
    mockGetValidators.mockResolvedValue([VALIDATOR]);

    const result = await preload(mockCurrency);

    expect(mockGetValidators).toHaveBeenCalledWith(mockCurrency);
    expect(result).toEqual([VALIDATOR]);
  });

  it("returns an empty array instead of throwing when the fetch fails", async () => {
    mockGetValidators.mockRejectedValue(new Error("Network error"));

    await expect(preload(mockCurrency)).resolves.toEqual([]);
  });
});

describe("hydrate", () => {
  it("seeds the getValidators cache with well-formed persisted validators", () => {
    hydrate([VALIDATOR], mockCurrency);

    expect(mockGetValidators.hydrate).toHaveBeenCalledWith(mockCurrency.id, [VALIDATOR]);
  });

  it("ignores a non-array payload", () => {
    hydrate({ not: "an array" }, mockCurrency);

    expect(mockGetValidators.hydrate).not.toHaveBeenCalled();
  });

  it("ignores a payload containing a malformed validator", () => {
    hydrate([{ ...VALIDATOR, stake: "3000" }], mockCurrency);

    expect(mockGetValidators.hydrate).not.toHaveBeenCalled();
  });

  it("accepts a validator without a name", () => {
    const { name: _name, ...noName } = VALIDATOR;

    hydrate([noName], mockCurrency);

    expect(mockGetValidators.hydrate).toHaveBeenCalledWith(mockCurrency.id, [noName]);
  });
});
