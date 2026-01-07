import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { JsonRpcProvider } from "ethers";
import * as RPC_API from "../network/node/rpc.common";
import * as ENCODER from "../staking/encoder";
import * as VALIDATORS from "../staking/validators";
import { getStakes } from "./getStakes";

describe("EVM Staking - getStakes", () => {
  const address = "0x1234567890abcdef1234567890abcdef12345678";

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return stake objects with positive amounts for supported currencies", async () => {
    const currency = getCryptoCurrencyById("celo");

    jest.spyOn(RPC_API, "withApi").mockImplementation(async (_cur, fn) => {
      const api = { call: jest.fn().mockResolvedValue("0x") } as unknown as JsonRpcProvider;
      return fn(api);
    });

    jest.spyOn(ENCODER, "encodeStakingData").mockReturnValue("0xdeadbeef");
    jest
      .spyOn(ENCODER, "decodeStakingResult")
      .mockReturnValue([{ toString: (): string => "1000000" }] as any);

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

    jest.spyOn(RPC_API, "withApi").mockImplementation(async (_cur, fn) => {
      const api = { call: jest.fn().mockResolvedValue("0x") } as unknown as JsonRpcProvider;
      return fn(api);
    });
    jest.spyOn(ENCODER, "encodeStakingData").mockReturnValue("0xdeadbeef");
    jest
      .spyOn(ENCODER, "decodeStakingResult")
      .mockReturnValue([{ toString: (): string => "0" }] as any);

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle multiple validators and filter zero amounts", async () => {
    const currency = getCryptoCurrencyById("sei_evm");

    jest.spyOn(VALIDATORS, "getValidators").mockResolvedValue(["seivaloper1abc", "seivaloper1def"]);

    jest.spyOn(RPC_API, "withApi").mockImplementation(async (_cur, fn) => {
      const api = { call: jest.fn().mockResolvedValue("0x") } as unknown as JsonRpcProvider;
      return fn(api);
    });

    jest.spyOn(ENCODER, "encodeStakingData").mockReturnValue("0xdeadbeef");

    const decodeSpy = jest.spyOn(ENCODER, "decodeStakingResult");
    decodeSpy.mockReturnValueOnce([
      {
        balance: { amount: "0", denom: "usei" },
        delegation: { delegator_address: address, validator_address: "seivaloper1abc" },
      },
    ] as any);
    decodeSpy.mockReturnValueOnce([
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

    jest.spyOn(RPC_API, "withApi").mockImplementation(async (_cur, fn) => {
      const api = {
        call: jest.fn().mockRejectedValue(new Error("rpc error")),
      } as unknown as JsonRpcProvider;
      return fn(api);
    });
    jest.spyOn(ENCODER, "encodeStakingData").mockReturnValue("0xdeadbeef");

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should handle SEI when no validators are available", async () => {
    const currency = getCryptoCurrencyById("sei_evm");

    jest.spyOn(VALIDATORS, "getValidators").mockResolvedValue([]);

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });

  it("should survive network failures during validator fetching", async () => {
    const currency = getCryptoCurrencyById("sei_evm");

    jest.spyOn(VALIDATORS, "getValidators").mockRejectedValue(new Error("Network unreachable"));

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

    jest.spyOn(RPC_API, "withApi").mockImplementation(async () => {
      throw new Error("API Error");
    });

    const result = await getStakes(currency, address);

    expect(result).toEqual({
      items: [],
    });
  });
});
