import { BigNumber } from "bignumber.js";
import * as network from "../network";
import { getBalance } from "./getBalance";

jest.mock("../network");

const mockGetAccount = network.getAccount as jest.MockedFunction<typeof network.getAccount>;

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return native balance for account with no assets", async () => {
    mockGetAccount.mockResolvedValue({
      balance: new BigNumber("1000000"),
      pendingRewards: new BigNumber("0"),
      assets: [],
    });

    const result = await getBalance("ALGO_ADDRESS");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      value: 1000000n,
      asset: { type: "native" },
      locked: 100000n, // min balance for 0 assets
    });
  });

  it("should include ASA token balances", async () => {
    mockGetAccount.mockResolvedValue({
      balance: new BigNumber("2000000"),
      pendingRewards: new BigNumber("0"),
      assets: [
        { assetId: "123", balance: new BigNumber("500"), isFrozen: false },
        { assetId: "456", balance: new BigNumber("1000"), isFrozen: false },
      ],
    });

    const result = await getBalance("ALGO_ADDRESS");

    expect(result).toHaveLength(3);

    // Native balance with locked amount accounting for 2 assets
    expect(result[0]).toEqual({
      value: 2000000n,
      asset: { type: "native" },
      locked: 300000n, // 0.1 ALGO base + 0.2 ALGO for 2 assets
    });

    // ASA balances
    expect(result[1]).toEqual({
      value: 500n,
      asset: { type: "asa", assetReference: "123" },
    });
    expect(result[2]).toEqual({
      value: 1000n,
      asset: { type: "asa", assetReference: "456" },
    });
  });

  it("should calculate correct locked amount based on number of assets", async () => {
    mockGetAccount.mockResolvedValue({
      balance: new BigNumber("5000000"),
      pendingRewards: new BigNumber("0"),
      assets: [
        { assetId: "1", balance: new BigNumber("100"), isFrozen: false },
        { assetId: "2", balance: new BigNumber("200"), isFrozen: false },
        { assetId: "3", balance: new BigNumber("300"), isFrozen: false },
        { assetId: "4", balance: new BigNumber("400"), isFrozen: false },
        { assetId: "5", balance: new BigNumber("500"), isFrozen: false },
      ],
    });

    const result = await getBalance("ALGO_ADDRESS");

    // 0.1 ALGO base + 0.5 ALGO for 5 assets = 600000 microAlgos
    expect(result[0].locked).toBe(600000n);
  });

  it("should handle zero balance account", async () => {
    mockGetAccount.mockResolvedValue({
      balance: new BigNumber("0"),
      pendingRewards: new BigNumber("0"),
      assets: [],
    });

    const result = await getBalance("ALGO_ADDRESS");

    expect(result[0].value).toBe(0n);
    expect(result[0].locked).toBe(100000n);
  });

  it("should handle large balances", async () => {
    mockGetAccount.mockResolvedValue({
      balance: new BigNumber("1000000000000"), // 1M ALGO
      pendingRewards: new BigNumber("0"),
      assets: [],
    });

    const result = await getBalance("ALGO_ADDRESS");

    expect(result[0].value).toBe(1000000000000n);
  });

  it("should propagate network errors", async () => {
    mockGetAccount.mockRejectedValue(new Error("Account not found"));

    await expect(getBalance("INVALID_ADDRESS")).rejects.toThrow("Account not found");
  });
});
