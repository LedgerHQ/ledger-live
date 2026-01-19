import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { JsonRpcProvider } from "ethers";
import { withApi } from "../network/node/rpc.common";
import { encodeStakingData, decodeStakingResult } from "../staking/encoder";
import { getValidators } from "../staking/validators";
import { getStakes } from "./getStakes";

jest.mock("../network/node/rpc.common", () => ({
  withApi: jest.fn(),
}));

jest.mock("../staking/encoder", () => ({
  encodeStakingData: jest.fn(),
  decodeStakingResult: jest.fn(),
}));

jest.mock("../staking/validators", () => ({
  getValidators: jest.fn(),
}));

const mockWithApi = withApi as jest.Mock;
const mockEncodeStakingData = encodeStakingData as jest.Mock;
const mockDecodeStakingResult = decodeStakingResult as jest.Mock;
const mockGetValidators = getValidators as jest.Mock;

describe("EVM Staking - getStakes", () => {
  const address = "0x1234567890abcdef1234567890abcdef12345678";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return stake objects with positive amounts for supported currencies", async () => {
    const currency = getCryptoCurrencyById("celo");

    mockWithApi.mockImplementation(async (_cur, fn) => {
      const api = { call: jest.fn().mockResolvedValue("0x") } as unknown as JsonRpcProvider;
      return fn(api);
    });

    mockEncodeStakingData.mockReturnValue("0xdeadbeef");
    mockDecodeStakingResult.mockReturnValue([{ toString: (): string => "1000000" }] as any);

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          uid: expect.any(String),
          address,
          state: "active",
          asset: expect.objectContaining({
            type: "native",
            name: "Celo",
            unit: expect.objectContaining({
              name: "CELO",
              code: "CELO",
              magnitude: 18,
            }),
          }),
          amount: 1000000n,
        }),
      ],
    });
  });

  it("should filter out stakes with zero amounts", async () => {
    const currency = getCryptoCurrencyById("celo");

    mockWithApi.mockImplementation(async (_cur, fn) => {
      const api = { call: jest.fn().mockResolvedValue("0x") } as unknown as JsonRpcProvider;
      return fn(api);
    });
    mockEncodeStakingData.mockReturnValue("0xdeadbeef");
    mockDecodeStakingResult.mockReturnValue([{ toString: (): string => "0" }] as any);

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle multiple validators and filter zero amounts", async () => {
    const currency = getCryptoCurrencyById("sei_evm");

    mockGetValidators.mockResolvedValue(["seivaloper1abc", "seivaloper1def"]);

    mockWithApi.mockImplementation(async (_cur, fn) => {
      const api = { call: jest.fn().mockResolvedValue("0x") } as unknown as JsonRpcProvider;
      return fn(api);
    });

    mockEncodeStakingData.mockReturnValue("0xdeadbeef");

    mockDecodeStakingResult.mockReturnValueOnce([
      {
        balance: { amount: "0", denom: "usei" },
        delegation: { delegator_address: address, validator_address: "seivaloper1abc" },
      },
    ] as any);
    mockDecodeStakingResult.mockReturnValueOnce([
      {
        balance: { amount: "42", denom: "usei" },
        delegation: { delegator_address: address, validator_address: "seivaloper1def" },
      },
    ] as any);

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          uid: expect.any(String),
          address,
          delegate: "seivaloper1def", // Should be the second validator (first has amount=0)
          state: "active",
          asset: expect.objectContaining({
            type: "native",
          }),
          amount: 42n, // Exact value from the mock
        }),
      ],
    });
  });

  it("should return empty list for currencies not configured for staking", async () => {
    const unsupportedCurrency = getCryptoCurrencyById("ethereum");

    const result = await getStakes(unsupportedCurrency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle RPC call failures gracefully without crashing", async () => {
    const currency = getCryptoCurrencyById("celo");

    mockWithApi.mockImplementation(async (_cur, fn) => {
      const api = {
        call: jest.fn().mockRejectedValue(new Error("rpc error")),
      } as unknown as JsonRpcProvider;
      return fn(api);
    });
    mockEncodeStakingData.mockReturnValue("0xdeadbeef");

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle SEI when no validators are available", async () => {
    const currency = getCryptoCurrencyById("sei_evm");

    mockGetValidators.mockResolvedValue([]);

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should survive network failures during validator fetching", async () => {
    const currency = getCryptoCurrencyById("sei_evm");

    mockGetValidators.mockRejectedValue(new Error("Network unreachable"));

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle completely unsupported currencies", async () => {
    const unsupportedCurrency = {
      id: "unsupported_currency" as CryptoCurrency["id"],
    } as CryptoCurrency;

    const result = await getStakes(unsupportedCurrency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle extreme edge cases and system failures", async () => {
    const currency = getCryptoCurrencyById("celo");

    mockWithApi.mockImplementation(async () => {
      throw new Error("API Error");
    });

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });
});
