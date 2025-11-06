import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setupMockCryptoAssetsStore } from "@ledgerhq/live-common/test-helpers/cryptoAssetsStore";
import { getAssetFromToken, getTokenFromAsset } from "./getTokenFromAsset";

beforeAll(() => {
  // Setup mock store for unit tests
  setupMockCryptoAssetsStore();
});

describe("getTokenFromAsset", () => {
  it("computes the token of the USDC asset", async () => {
    expect(
      await getTokenFromAsset({
        type: "token",
        assetReference: "USDC",
        assetOwner: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      }),
    ).toMatchObject({
      id: "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      contractAddress: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      name: "USDC",
    });
  });

  it("does not compute the token of an unknown asset, trusting the CAL", async () => {
    expect(
      await getTokenFromAsset({
        type: "token",
        assetReference: "unknown-reference",
        assetOwner: "unknown-owner",
      }),
    ).toBeUndefined();
  });
});

describe("getAssetFromToken", () => {
  it("computes the asset of the USDC token", () => {
    expect(
      getAssetFromToken({
        tokenType: "stellar",
        name: "USDC",
        contractAddress: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        units: [{ name: "USDC", code: "usdc", magnitude: 7 }],
      } as unknown as TokenCurrency),
    ).toEqual({
      assetOwner: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      assetReference: "USDC",
      name: "USDC",
      type: "stellar",
      unit: {
        code: "usdc",
        magnitude: 7,
        name: "USDC",
      },
    });
  });
});
