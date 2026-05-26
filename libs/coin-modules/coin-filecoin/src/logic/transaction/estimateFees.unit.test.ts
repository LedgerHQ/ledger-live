import { estimateFees } from "./estimateFees";
import { fetchEstimatedFees } from "../../api/api";
import { validateAddress } from "../../network";

jest.mock("../../api/api");
jest.mock("../../network");

const mockedFetchEstimatedFees = jest.mocked(fetchEstimatedFees);
const mockedValidateAddress = jest.mocked(validateAddress);

describe("estimateFees", () => {
  beforeEach(() => {
    mockedValidateAddress.mockImplementation((addr: string) => ({
      isValid: true,
      parsedAddress: { toString: () => addr },
    }));
  });

  afterEach(() => jest.resetAllMocks());

  it("returns FeeEstimation with gas parameters for native transfer", async () => {
    mockedFetchEstimatedFees.mockResolvedValue({
      gas_limit: 10000,
      gas_fee_cap: "200000",
      gas_premium: "5000",
      nonce: 7,
    });

    const result = await estimateFees({
      sender: "f1sender",
      recipient: "f1recipient",
      amount: 1000n,
      asset: { type: "native" },
    });

    expect(result.value).toBe(BigInt("2000000000"));
    expect(result.parameters).toEqual({
      gasLimit: 10000,
      gasFeeCap: "200000",
      gasPremium: "5000",
      nonce: 7,
    });
  });

  it("throws on invalid sender address", async () => {
    mockedValidateAddress.mockReturnValueOnce({
      isValid: false,
      parsedAddress: { toString: () => "" },
    });

    await expect(
      estimateFees({
        sender: "invalid",
        recipient: "f1recipient",
        amount: 100n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("Invalid sender address");
  });

  it("throws on invalid recipient address", async () => {
    mockedValidateAddress
      .mockReturnValueOnce({ isValid: true, parsedAddress: { toString: () => "f1ok" } })
      .mockReturnValueOnce({ isValid: false, parsedAddress: { toString: () => "" } });

    await expect(
      estimateFees({
        sender: "f1sender",
        recipient: "invalid",
        amount: 100n,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("Invalid recipient address");
  });
});
