import { AssertionError, fail } from "assert";
import axios from "axios";
import { NFTMetadata } from "@ledgerhq/types-live";
import { collectionMetadata, nftMetadata } from "../../bridge/nftResolvers";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);

const metadata: NFTMetadata = {
  description: "desc",
  links: {
    explorer: "explorer",
    opensea: "opensea",
    rarible: "rarible",
    etherscan: null,
  },
  medias: {
    big: {
      mediaType: "png",
      uri: "big",
    },
    original: {
      mediaType: "png",
      uri: "original",
    },
    preview: {
      mediaType: "png",
      uri: "preview",
    },
  },
  nftName: "name",
  properties: [],
  tokenName: "collectionName",
};

describe("EVM Family", () => {
  beforeAll(() => {
    mockedAxios.mockResolvedValue({ data: [{}] });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("nftResolvers", () => {
    describe("nftMetadata", () => {
      it("should reject a currency when NFT is not activated on it", async () => {
        try {
          await nftMetadata({
            contract: "0xWhatever",
            currencyId: "bitcoin",
            tokenId: "1",
          });
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(Error);
          expect((e as Error).message).toBe("Ethereum Bridge NFT Resolver: Unsupported currency");
          expect(axios).not.toHaveBeenCalled();
        }
      });

      it("should return nft metadata", async () => {
        mockedAxios.mockResolvedValueOnce({
          data: [
            {
              status: 200,
              result: {
                contract: "0xWhatever",
                tokenId: "1",
                ...metadata,
              },
            },
          ],
        });

        const result = await nftMetadata({
          contract: "0xWhatever",
          currencyId: "ethereum",
          tokenId: "1",
        });

        expect(result).toEqual({
          status: 200,
          result: {
            contract: "0xWhatever",
            tokenId: "1",
            ...metadata,
          },
        });
      });
    });

    describe("collectionMetadata", () => {
      it("should reject a currency when NFT is not activated on it", async () => {
        try {
          await collectionMetadata({
            contract: "0xWhatever",
            currencyId: "bitcoin",
          });
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(Error);
          expect((e as Error).message).toBe("Ethereum Bridge NFT Resolver: Unsupported currency");
          expect(axios).not.toHaveBeenCalled();
        }
      });

      it("should return nft metadata", async () => {
        mockedAxios.mockResolvedValueOnce({
          data: [
            {
              status: 200,
              result: {
                contract: "0xWhatever",
                tokenName: "CollectionName",
              },
            },
          ],
        });

        const result = await collectionMetadata({
          contract: "0xWhatever",
          currencyId: "ethereum",
        });

        expect(result).toEqual({
          status: 200,
          result: {
            contract: "0xWhatever",
            tokenName: "CollectionName",
          },
        });
      });
    });
  });
});
