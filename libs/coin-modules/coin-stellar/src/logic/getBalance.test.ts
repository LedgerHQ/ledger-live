import { getBalance } from "./getBalance";
import { fetchAccount } from "../network";
import { setupMockCryptoAssetsStore } from "@ledgerhq/live-common/test-helpers/cryptoAssetsStore";

jest.mock("../network", () => ({
  fetchAccount: jest.fn(),
}));

beforeAll(() => {
  // Setup mock store for unit tests
  setupMockCryptoAssetsStore();
});

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
          asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
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
          assetOwner: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        },
      },
    ]);

    expect(fetchAccount).toHaveBeenCalledWith("test-address");
  });
});
