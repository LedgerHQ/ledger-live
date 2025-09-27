import { getBalance } from "./getBalance";
import { fetchAccount } from "../network";

jest.mock("../network", () => ({
  fetchAccount: jest.fn(),
}));

describe("getBalance", () => {
  it("returns native balance when no assets are present", async () => {
    (fetchAccount as jest.Mock).mockResolvedValue({
      balance: 100000000,
      spendableBalance: 99999990,
      assets: [],
    });

    const result = await getBalance("test-address");

    expect(result).toEqual([
      {
        value: BigInt(100000000),
        asset: { type: "native" },
        locked: BigInt(10),
      },
    ]);
  });

  it("returns native and asset balances when assets are present", async () => {
    (fetchAccount as jest.Mock).mockResolvedValue({
      balance: 100000000,
      spendableBalance: 99999990,
      assets: [
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "issuer-address",
          balance: "50.1234567",
        },
      ],
    });

    const result = await getBalance("test-address");

    expect(result).toEqual([
      {
        value: BigInt(100000000),
        asset: { type: "native" },
        locked: BigInt(10),
      },
      {
        value: BigInt(501234567),
        asset: {
          type: "credit_alphanum4",
          assetReference: "USDC",
          assetOwner: "issuer-address",
        },
      },
    ]);

    expect(fetchAccount).toHaveBeenCalledWith("test-address");
  });
});
