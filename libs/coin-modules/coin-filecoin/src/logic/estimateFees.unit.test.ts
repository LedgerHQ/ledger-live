import { fetchEstimatedFees } from "../api/api";
import { validateAddress, isFilEthAddress, isEthereumConvertableAddr } from "../network/addresses";
import type { ValidateAddressResult } from "../network/addresses";
import { Methods } from "../bridge/utils";
import { createMockEstimatedFeesResponse } from "../test/fixtures";
import { estimateFees } from "./estimateFees";

jest.mock("../api/api");
jest.mock("../network/addresses");
jest.mock("@ledgerhq/logs");

const mockedFetchEstimatedFees = fetchEstimatedFees as jest.MockedFunction<
  typeof fetchEstimatedFees
>;
const mockedValidateAddress = validateAddress as jest.MockedFunction<typeof validateAddress>;
const mockedIsFilEthAddress = isFilEthAddress as jest.MockedFunction<typeof isFilEthAddress>;
const mockedIsEthereumConvertableAddr = isEthereumConvertableAddr as jest.MockedFunction<
  typeof isEthereumConvertableAddr
>;

const F1_ADDR = "f1sender";
const RECIPIENT_F1 = "f1recipient";
const F4_ADDR = "f4recipient";

function makeValidResult(addr: string): ValidateAddressResult {
  return {
    isValid: true,
    parsedAddress: { toString: () => addr } as unknown as ValidateAddressResult extends {
      isValid: true;
    }
      ? ValidateAddressResult["parsedAddress"]
      : never,
  } as unknown as ValidateAddressResult;
}

const NATIVE_INTENT = {
  intentType: "transaction" as const,
  type: "send",
  sender: F1_ADDR,
  recipient: RECIPIENT_F1,
  amount: 100_000_000_000_000_000n,
  asset: { type: "native" as const },
};

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: all addresses are valid f1-style (not ETH delegated)
    mockedValidateAddress.mockImplementation(addr => makeValidResult(addr));
    mockedIsFilEthAddress.mockReturnValue(false);
    mockedIsEthereumConvertableAddr.mockReturnValue(false);
  });

  it("returns fee value as gasFeeCap * gasLimit (bigint)", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(
      createMockEstimatedFeesResponse({
        gas_limit: 1_000_000,
        gas_fee_cap: "100",
        gas_premium: "80",
        nonce: 3,
      }),
    );

    const result = await estimateFees(NATIVE_INTENT);

    expect(result.value).toBe(100_000_000n); // 100 * 1_000_000
    expect(result.parameters).toMatchObject({
      gasFeeCap: "100",
      gasPremium: "80",
      gasLimit: 1_000_000,
      nonce: 3,
    });
  });

  it("calls fetchEstimatedFees with Transfer method for f1 recipient", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(createMockEstimatedFeesResponse());

    await estimateFees(NATIVE_INTENT);

    expect(mockedFetchEstimatedFees).toHaveBeenCalledWith(
      expect.objectContaining({ methodNum: Methods.Transfer }),
    );
  });

  it("calls fetchEstimatedFees with InvokeEVM method for f4 (delegated ETH) recipient", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(createMockEstimatedFeesResponse());
    mockedIsFilEthAddress.mockReturnValue(true);

    await estimateFees({ ...NATIVE_INTENT, recipient: F4_ADDR });

    expect(mockedFetchEstimatedFees).toHaveBeenCalledWith(
      expect.objectContaining({ methodNum: Methods.InvokeEVM }),
    );
  });

  it("throws on invalid sender address", async () => {
    mockedValidateAddress.mockImplementationOnce(() => ({ isValid: false }));

    await expect(estimateFees({ ...NATIVE_INTENT, sender: "bad" })).rejects.toThrow(
      "Invalid sender address",
    );
  });

  it("throws on invalid recipient address", async () => {
    mockedValidateAddress
      .mockImplementationOnce(addr => makeValidResult(addr)) // sender is valid
      .mockImplementationOnce(() => ({ isValid: false })); // recipient is invalid

    await expect(estimateFees({ ...NATIVE_INTENT, recipient: "bad" })).rejects.toThrow(
      "Invalid recipient address",
    );
  });
});
