import { getAssetFromToken } from "./getAssetFromToken";
import { getMockedTokenCurrency } from "../test/fixtures/currency.fixture";

describe("getAssetFromToken", () => {
  it("returns asset from TEST token", () => {
    const owner = "owner";
    const token = getMockedTokenCurrency({
      contractAddress: "0.0.1234567",
      name: "TEST",
      units: [
        {
          name: "Test",
          code: "TEST",
          magnitude: 8,
        },
      ],
    });

    expect(getAssetFromToken(token, owner)).toEqual({
      assetReference: token.contractAddress,
      assetOwner: owner,
      name: token.name,
      type: token.tokenType,
      unit: token.units[0],
    });
  });
});
