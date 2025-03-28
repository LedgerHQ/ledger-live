import { useQuery } from "@tanstack/react-query";
import { NFTS_QUERY_KEY } from "../../queryKeys";
import { useNftFloorPrice } from "../useNftFloorPrice";
import BigNumber from "bignumber.js";
import { NFTs } from "@ledgerhq/coin-framework/mocks/fixtures/nftsSamples";
import { encodeNftId } from "@ledgerhq/coin-framework/lib/nft/nftId";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { renderHook } from "@testing-library/react";

jest.mock("@tanstack/react-query");
jest.setTimeout(30000);

type FakeNFTRaw = {
  id: string;
  tokenId: string;
  amount: BigNumber;
  contract: string;
  standard: "ERC721";
  currencyId: string;
  metadata: undefined;
};

const mockedNft: FakeNFTRaw = {
  id: encodeNftId("foo", NFTs[0].collection.contract, "1", "ethereum"),
  tokenId: String(1),
  amount: new BigNumber(0),
  contract: NFTs[0].collection.contract,
  standard: "ERC721" as const,
  currencyId: "ethereum",
  metadata: undefined,
};

const mockedCurrency: CryptoCurrency = cryptocurrenciesById.ethereum;

describe("useNftFloorPrice", () => {
  it("calls useQuery with correct arguments", () => {
    renderHook(() => useNftFloorPrice(mockedNft, mockedCurrency));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: [NFTS_QUERY_KEY.FloorPrice, mockedNft, mockedCurrency],
      queryFn: expect.any(Function),
    });
  });
});
