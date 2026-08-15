import { JsonRpcProvider } from "ethers";
import type { EvmConfigInfo } from "../config";
import { createMockEvmContext } from "../fixtures/context.fixtures";
import { withApi } from "../network/node/rpc.common";
import { encodeStakingData, decodeStakingResult } from "../staking/encoder";
import { getValidators } from "../staking/validators";
import { getStakes } from "./getStakes";

jest.mock("../network/node/rpc.common", () => ({
  ...jest.requireActual("../network/node/rpc.common"),
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

const externalNodeConfig = { type: "external" as const, uri: "https://test" };
const context = createMockEvmContext({
  node: externalNodeConfig,
  name: "Celo",
} as Partial<EvmConfigInfo>);
const makeValidator = (validatorAddress: string) => ({
  id: validatorAddress,
  address: validatorAddress,
  name: "",
});

describe("EVM Staking - getStakes", () => {
  const address = "0x1234567890abcdef1234567890abcdef12345678";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return stake objects with positive amounts for supported currencies", async () => {
    mockWithApi.mockImplementation(async (_cur, _currencyId, fn) => {
      const api = { call: jest.fn().mockResolvedValue("0x") } as unknown as JsonRpcProvider;
      return fn(api);
    });

    mockEncodeStakingData.mockReturnValue("0xdeadbeef");
    mockDecodeStakingResult.mockReturnValue([{ toString: (): string => "1000000" }] as any);

    const result = await getStakes(context, "celo", address);

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
    mockWithApi.mockImplementation(async (_cur, _currencyId, fn) => {
      const api = { call: jest.fn().mockResolvedValue("0x") } as unknown as JsonRpcProvider;
      return fn(api);
    });
    mockEncodeStakingData.mockReturnValue("0xdeadbeef");
    mockDecodeStakingResult.mockReturnValue([{ toString: (): string => "0" }] as any);

    const result = await getStakes(context, "celo", address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle multiple validators and filter zero amounts", async () => {
    mockGetValidators.mockResolvedValue({
      items: [makeValidator("seivaloper1abc"), makeValidator("seivaloper1def")],
      next: undefined,
    });

    mockWithApi.mockImplementation(async (_cur, _currencyId, fn) => {
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

    const result = await getStakes(context, "sei_evm", address);

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
          amount: 42n * 10n ** 12n,
        }),
      ],
    });
  });

  it("should return empty list for currencies not configured for staking", async () => {
    const result = await getStakes(context, "ethereum", address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle RPC call failures gracefully without crashing", async () => {
    mockWithApi.mockImplementation(async (_cur, _currencyId, fn) => {
      const api = {
        call: jest.fn().mockRejectedValue(new Error("rpc error")),
      } as unknown as JsonRpcProvider;
      return fn(api);
    });
    mockEncodeStakingData.mockReturnValue("0xdeadbeef");

    const result = await getStakes(context, "celo", address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should treat SEI missing delegation reverts as an empty stake without logging", async () => {
    mockGetValidators.mockResolvedValue({
      items: [makeValidator("seivaloper1abc")],
      next: undefined,
    });
    mockWithApi.mockImplementation(async (_cur, _currencyId, fn) => {
      const api = {
        call: jest.fn().mockRejectedValue(
          Object.assign(new Error("missing revert data"), {
            code: "CALL_EXCEPTION",
            data: null,
            reason: null,
            revert: null,
            shortMessage: "missing revert data",
          }),
        ),
      };
      return fn(api);
    });
    mockEncodeStakingData.mockReturnValue("0xdeadbeef");

    const result = await getStakes(context, "sei_evm", address);

    expect(result).toEqual({
      items: [],
    });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should handle SEI when no validators are available", async () => {
    mockGetValidators.mockResolvedValue({ items: [], next: undefined });

    const result = await getStakes(context, "sei_evm", address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should survive network failures during validator fetching", async () => {
    mockGetValidators.mockRejectedValue(new Error("Network unreachable"));

    const result = await getStakes(context, "sei_evm", address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle completely unsupported currencies", async () => {
    const result = await getStakes(context, "unsupported_currency", address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle extreme edge cases and system failures", async () => {
    mockWithApi.mockImplementation(async () => {
      throw new Error("API Error");
    });

    const result = await getStakes(context, "celo", address);

    expect(result).toEqual({
      items: [],
    });
  });
});
