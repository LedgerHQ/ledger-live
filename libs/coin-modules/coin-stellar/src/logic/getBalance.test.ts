import { getBalance } from "./getBalance";
import { fetchAccount } from "../network";
import { setCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens as addTokensLegacy } from "@ledgerhq/cryptoassets/legacy/legacy-utils";

jest.mock("../network", () => ({
  fetchAccount: jest.fn(),
}));

beforeAll(() => {
  initializeLegacyTokens(addTokensLegacy);
  setCryptoAssetsStore(legacyCryptoAssetsStore);
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
