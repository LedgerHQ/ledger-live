import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { createFixtureNFT } from "./nfts";
import { NFTs, NFTs_BASE, NFTs_POLYGON, NFTs_SOLANA } from "./nftsSamples";

const POL = getCryptoCurrencyById("polygon");
const BASE = getCryptoCurrencyById("base");
const SOLANA = getCryptoCurrencyById("solana");
describe("nfts fixtures", () => {
  it("createFixtureNFT", () => {
    const FIXTURE = createFixtureNFT("account-mock");
    expect(FIXTURE.currencyId).toEqual("ethereum");
    expect(FIXTURE.amount).not.toBeUndefined();
    expect(FIXTURE.contract).not.toBeUndefined();
    expect(FIXTURE.tokenId).not.toBeUndefined();
    expect(FIXTURE.id).toContain("account-mock");

    expect(NFTs.map(nft => nft.collection.contract).includes(FIXTURE.contract)).toBeTruthy();

    const FIXTURE_POL = createFixtureNFT("account-mock-pol", POL);
    expect(FIXTURE_POL.currencyId).toEqual("polygon");

    expect(
      NFTs_POLYGON.map(nft => nft.collection.contract).includes(FIXTURE_POL.contract),
    ).toBeTruthy();

    const FIXTURE_BASE = createFixtureNFT("account-mock-base", BASE);
    expect(FIXTURE_BASE.currencyId).toEqual("base");

    expect(
      NFTs_BASE.map(nft => nft.collection.contract).includes(FIXTURE_BASE.contract),
    ).toBeTruthy();

    const FIXTURE_SOLANA = createFixtureNFT("account-mock-solana", SOLANA);
    expect(FIXTURE_SOLANA.currencyId).toEqual("solana");

    expect(
      NFTs_SOLANA.map(nft => nft.collection.contract).includes(FIXTURE_SOLANA.contract),
    ).toBeTruthy();
  });
});
