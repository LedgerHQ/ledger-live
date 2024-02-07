import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getFloorPrice } from "./metadataservice";

jest.mock("@ledgerhq/live-network/network", () =>
  jest.fn().mockResolvedValue({ data: { ticker: "FOO", value: 42 } }),
);

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

describe("getFloorPrice", () => {
  it("should return null if the currency is not supported", async () => {
    const nft = {
      id: "1",
      tokenId: "1",
      amount: new BigNumber(1),
      contract: "0x",
      standard: "ERC721" as const,
      currencyId: "bitcoin",
    };
    expect(await getFloorPrice(nft, bitcoin)).toBeNull();
  });

  it("will call backend API and that returns {ticker,value}", async () => {
    const nft = {
      id: "1",
      tokenId: "1",
      amount: new BigNumber(1),
      contract: "0x",
      standard: "ERC721" as const,
      currencyId: "ethereum",
    };
    expect(await getFloorPrice(nft, ethereum)).toEqual({
      ticker: "FOO",
      value: 42,
    });
  });
});
