import { getCryptoCurrencyById } from "../../currencies";
import { createFixtureNFT, NFTs, NFTs_POLYGON } from "./nfts";

const POL = getCryptoCurrencyById("polygon");
describe("nfts fixtures", () => {
  it("createFixtureNFT", () => {
    const FIXTURE = createFixtureNFT("account-mock");
    expect(FIXTURE.currencyId).toEqual("ethereum");
    expect(FIXTURE.amount).not.toBeUndefined();
    expect(FIXTURE.contract).not.toBeUndefined();
    expect(FIXTURE.tokenId).not.toBeUndefined();
    expect(FIXTURE.id).toContain("account-mock");

    expect(
      NFTs.map((nft) => nft.tokenId).includes(FIXTURE.tokenId)
    ).toBeTruthy();

    const FIXTURE_POL = createFixtureNFT("account-mock-pol", POL);
    expect(FIXTURE_POL.currencyId).toEqual("polygon");

    expect(
      NFTs_POLYGON.map((nft) => nft.tokenId).includes(FIXTURE_POL.tokenId)
    ).toBeTruthy();
  });
});
