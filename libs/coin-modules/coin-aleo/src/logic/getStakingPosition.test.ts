import BigNumber from "bignumber.js";
import { apiClient } from "../network/api";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import {
  getStakingPosition,
  parseBondedMapping,
  parseUnbondingMapping,
} from "./getStakingPosition";

jest.mock("../network/api");

const mockApiClient = jest.mocked(apiClient);
const mockCurrency = getMockedCurrency();
const ADDRESS = "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs";
const VALIDATOR = "aleo1l2a3lakq9pz9w9hyre7rk9zmk64wzr62z0q26wglr8tmf8w5cyqqxtt364";

describe("parseBondedMapping", () => {
  it("parses validator and microcredits from the struct plaintext", () => {
    const raw = `{\n  validator: ${VALIDATOR},\n  microcredits: 111468399u64\n}`;
    expect(parseBondedMapping(raw)).toEqual({
      validator: VALIDATOR,
      microcredits: new BigNumber(111468399),
    });
  });

  it("returns null for null input", () => {
    expect(parseBondedMapping(null)).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(parseBondedMapping("not a struct")).toBeNull();
  });
});

describe("parseUnbondingMapping", () => {
  it("parses microcredits and height from the struct plaintext", () => {
    const raw = "{\n  microcredits: 10000000000u64,\n  height: 17655195u32\n}";
    expect(parseUnbondingMapping(raw)).toEqual({
      microcredits: new BigNumber(10000000000),
      height: 17655195,
    });
  });

  it("returns null for null input", () => {
    expect(parseUnbondingMapping(null)).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(parseUnbondingMapping("{}")).toBeNull();
  });
});

describe("getStakingPosition", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches both mappings in parallel and returns parsed amounts", async () => {
    mockApiClient.getBondedMapping.mockResolvedValue(
      `{\n  validator: ${VALIDATOR},\n  microcredits: 5000000u64\n}`,
    );
    mockApiClient.getUnbondingMapping.mockResolvedValue(
      "{\n  microcredits: 2000000u64,\n  height: 100u32\n}",
    );

    const result = await getStakingPosition(mockCurrency, ADDRESS);

    expect(mockApiClient.getBondedMapping).toHaveBeenCalledWith(mockCurrency, ADDRESS);
    expect(mockApiClient.getUnbondingMapping).toHaveBeenCalledWith(mockCurrency, ADDRESS);
    expect(result).toEqual({
      bondedBalance: new BigNumber(5000000),
      bondedValidator: VALIDATOR,
      unbondingBalance: new BigNumber(2000000),
      unbondingHeight: 100,
    });
  });

  it("returns zeroed position when the address has no staking entries", async () => {
    mockApiClient.getBondedMapping.mockResolvedValue(null);
    mockApiClient.getUnbondingMapping.mockResolvedValue(null);

    const result = await getStakingPosition(mockCurrency, ADDRESS);

    expect(result).toEqual({
      bondedBalance: new BigNumber(0),
      bondedValidator: null,
      unbondingBalance: new BigNumber(0),
      unbondingHeight: null,
    });
  });
});
