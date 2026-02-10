import { estimateFees, getSequence } from "./estimateFees";
import { fetchEstimatedFees } from "../network/api";
import { TEST_ADDRESSES, createMockEstimatedFeesResponse } from "../test/fixtures";

jest.mock("../network/api");

const mockedFetchEstimatedFees = fetchEstimatedFees as jest.MockedFunction<
  typeof fetchEstimatedFees
>;

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return fee estimation with gas parameters", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(
      createMockEstimatedFeesResponse({
        gas_limit: 1000000,
        gas_fee_cap: "100000",
        gas_premium: "50000",
        nonce: 5,
      }),
    );

    const result = await estimateFees(
      TEST_ADDRESSES.F1_ADDRESS,
      TEST_ADDRESSES.RECIPIENT_F1,
      100000000000000000n,
    );

    expect(result.value).toBe(100000000000n); // 100000 * 1000000
    expect(result.parameters).toEqual({
      gasFeeCap: 100000n,
      gasPremium: 50000n,
      gasLimit: 1000000n,
    });
  });

  it("should pass method and params for token transfers", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(
      createMockEstimatedFeesResponse({
        gas_limit: 2000000,
        gas_fee_cap: "200000",
        gas_premium: "100000",
        nonce: 10,
      }),
    );

    await estimateFees(
      TEST_ADDRESSES.F1_ADDRESS,
      TEST_ADDRESSES.ERC20_CONTRACT,
      100000000000000000n,
      3844450837, // InvokeEVM
      "encoded_params",
    );

    expect(mockedFetchEstimatedFees).toHaveBeenCalledWith({
      from: TEST_ADDRESSES.F1_ADDRESS,
      to: TEST_ADDRESSES.ERC20_CONTRACT,
      methodNum: 3844450837,
      params: "encoded_params",
      value: "100000000000000000",
    });
  });

  it("should propagate errors", async () => {
    mockedFetchEstimatedFees.mockRejectedValueOnce(new Error("Fee estimation failed"));

    await expect(
      estimateFees(TEST_ADDRESSES.F1_ADDRESS, TEST_ADDRESSES.RECIPIENT_F1, 100n),
    ).rejects.toThrow("Fee estimation failed");
  });
});

describe("getSequence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return nonce from fee estimation response", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(
      createMockEstimatedFeesResponse({
        nonce: 42,
      }),
    );

    const result = await getSequence(TEST_ADDRESSES.F1_ADDRESS);

    expect(result).toBe(42n);
  });

  it("should return 0n when nonce is not provided", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce({
      gas_limit: 1000000,
      gas_fee_cap: "100000",
      gas_premium: "50000",
      nonce: 0,
    });

    const result = await getSequence(TEST_ADDRESSES.F1_ADDRESS);

    expect(result).toBe(0n);
  });

  it("should use self-transfer for nonce lookup", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(
      createMockEstimatedFeesResponse({
        nonce: 5,
      }),
    );

    await getSequence(TEST_ADDRESSES.F1_ADDRESS);

    expect(mockedFetchEstimatedFees).toHaveBeenCalledWith({
      from: TEST_ADDRESSES.F1_ADDRESS,
      to: TEST_ADDRESSES.F1_ADDRESS,
      methodNum: 0,
    });
  });
});
