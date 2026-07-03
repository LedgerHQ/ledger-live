import { apiClient } from "../network/api";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import {
  getValidators,
  isValidCommitteeResponse,
  isValidValidatorMetadataResponse,
} from "./getValidators";

jest.mock("../network/api");

const mockApiClient = jest.mocked(apiClient);
const mockCurrency = getMockedCurrency();

const OPEN_VALIDATOR = "aleo1l2a3lakq9pz9w9hyre7rk9zmk64wzr62z0q26wglr8tmf8w5cyqqxtt364";
const CLOSED_VALIDATOR = "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs";
const LOW_STAKE_OPEN_VALIDATOR = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

describe("isValidCommitteeResponse", () => {
  it("accepts a well-formed committee response", () => {
    expect(isValidCommitteeResponse({ members: { [OPEN_VALIDATOR]: [1000, true, 5] } })).toBe(true);
  });

  it("accepts a response with no members field", () => {
    expect(isValidCommitteeResponse({})).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidCommitteeResponse(null)).toBe(false);
  });

  it("rejects non-object values", () => {
    expect(isValidCommitteeResponse("not an object")).toBe(false);
  });

  it("rejects a members map with a malformed tuple", () => {
    expect(isValidCommitteeResponse({ members: { [OPEN_VALIDATOR]: [1000, true] } })).toBe(false);
  });

  it("rejects a members map with wrong tuple field types", () => {
    expect(isValidCommitteeResponse({ members: { [OPEN_VALIDATOR]: ["1000", true, 5] } })).toBe(
      false,
    );
  });
});

describe("isValidValidatorMetadataResponse", () => {
  it("accepts a well-formed metadata response", () => {
    expect(isValidValidatorMetadataResponse({ [OPEN_VALIDATOR]: "Validator One" })).toBe(true);
  });

  it("accepts an empty object", () => {
    expect(isValidValidatorMetadataResponse({})).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidValidatorMetadataResponse(null)).toBe(false);
  });

  it("rejects a metadata map with non-string values", () => {
    expect(isValidValidatorMetadataResponse({ [OPEN_VALIDATOR]: 42 })).toBe(false);
  });
});

describe("getValidators", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // getValidators is now cached (keyed by currency.id); reset between tests
    // so each test's mocked API responses are actually exercised instead of
    // being masked by a previous test's cached result.
    getValidators.reset();
  });

  it("fetches the committee for the configured network and returns sorted validators", async () => {
    mockApiClient.getCommittee.mockResolvedValue({
      members: {
        [CLOSED_VALIDATOR]: [5000, false, 10],
        [OPEN_VALIDATOR]: [3000, true, 5],
        [LOW_STAKE_OPEN_VALIDATOR]: [1000, true, 8],
      },
    });
    mockApiClient.getValidatorMetadata.mockResolvedValue({
      [OPEN_VALIDATOR]: "Open Validator",
    });

    const result = await getValidators(mockCurrency);

    expect(mockApiClient.getCommittee).toHaveBeenCalledWith(mockCurrency);
    expect(mockApiClient.getValidatorMetadata).toHaveBeenCalledWith(mockCurrency);
    // open validators sorted by descending stake come before closed ones
    expect(result.map(v => v.address)).toEqual([
      OPEN_VALIDATOR,
      LOW_STAKE_OPEN_VALIDATOR,
      CLOSED_VALIDATOR,
    ]);
    expect(result[0]).toEqual({
      address: OPEN_VALIDATOR,
      name: "Open Validator",
      stake: 3000,
      isOpen: true,
      commission: 5,
    });
    expect(result[2]).toEqual({
      address: CLOSED_VALIDATOR,
      name: undefined,
      stake: 5000,
      isOpen: false,
      commission: 10,
    });
  });

  it("returns an empty array when the committee has no members", async () => {
    mockApiClient.getCommittee.mockResolvedValue({});
    mockApiClient.getValidatorMetadata.mockResolvedValue({});

    const result = await getValidators(mockCurrency);

    expect(result).toEqual([]);
  });

  it("still returns validators when the metadata request fails", async () => {
    mockApiClient.getCommittee.mockResolvedValue({
      members: { [OPEN_VALIDATOR]: [3000, true, 5] },
    });
    mockApiClient.getValidatorMetadata.mockRejectedValue(new Error("metadata unavailable"));

    const result = await getValidators(mockCurrency);

    expect(result).toEqual([
      { address: OPEN_VALIDATOR, name: undefined, stake: 3000, isOpen: true, commission: 5 },
    ]);
  });

  it("ignores a malformed metadata response instead of throwing", async () => {
    mockApiClient.getCommittee.mockResolvedValue({
      members: { [OPEN_VALIDATOR]: [3000, true, 5] },
    });
    // @ts-expect-error deliberately malformed payload from the API
    mockApiClient.getValidatorMetadata.mockResolvedValue({ [OPEN_VALIDATOR]: 42 });

    const result = await getValidators(mockCurrency);

    expect(result[0].name).toBeUndefined();
  });

  it("throws when the committee response is malformed", async () => {
    // @ts-expect-error deliberately malformed payload from the API
    mockApiClient.getCommittee.mockResolvedValue({ members: { [OPEN_VALIDATOR]: [3000, true] } });
    mockApiClient.getValidatorMetadata.mockResolvedValue({});

    await expect(getValidators(mockCurrency)).rejects.toThrow(
      "Unable to fetch Aleo validators: invalid committee response",
    );
  });

  it("propagates an error when the committee request fails", async () => {
    mockApiClient.getCommittee.mockRejectedValue(new Error("Network error"));

    await expect(getValidators(mockCurrency)).rejects.toThrow("Network error");
  });
});
