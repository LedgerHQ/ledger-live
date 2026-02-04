import { AssertionError, fail } from "assert";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { NFTMetadata } from "@ledgerhq/types-live";
import axios from "axios";
import { collectionMetadata, nftMetadata } from "../../nftResolvers";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);

// Add solana manually to the env until officially supported
setEnv("NFT_CURRENCIES", [...getEnv("NFT_CURRENCIES"), "solana"]);

const currencyId = "solana";
const wrongCurrencyId = "bitcoin";

const randomNftContract = "13vQFDKvvmebfFQdN4XVS7jDuzXoThm2DMn5SxPJhWmA";
const randomTokenId = "0";

const metadata: NFTMetadata = {
  description: "desc",
  links: {
    explorer: "explorer",
    opensea: null,
    rarible: null,
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

describe("Solana Family", () => {
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
            contract: randomNftContract,
            currencyId: wrongCurrencyId,
            tokenId: randomTokenId,
          });
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(Error);
          expect((e as Error).message).toBe(
            `Solana Bridge NFT Resolver: Unsupported currency (${wrongCurrencyId})`,
          );
          expect(axios).not.toHaveBeenCalled();
        }
      });

      it("should return nft metadata", async () => {
        mockedAxios.mockResolvedValueOnce({
          data: [
            {
              status: 200,
              result: {
                contract: randomNftContract,
                tokenId: randomTokenId,
                ...metadata,
              },
            },
          ],
        });

        const result = await nftMetadata({
          contract: randomNftContract,
          currencyId,
          tokenId: randomTokenId,
        });

        expect(result).toEqual({
          status: 200,
          result: {
            contract: randomNftContract,
            tokenId: randomTokenId,
            ...metadata,
          },
        });
      });
    });

    describe("collectionMetadata", () => {
      it("should reject a currency when NFT is not activated on it", async () => {
        try {
          await collectionMetadata({
            contract: randomNftContract,
            currencyId: wrongCurrencyId,
          });
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(Error);
          expect((e as Error).message).toBe(
            `Solana Bridge NFT Resolver: Unsupported currency (${wrongCurrencyId})`,
          );
          expect(axios).not.toHaveBeenCalled();
        }
      });

      it("should return nft metadata", async () => {
        mockedAxios.mockResolvedValueOnce({
          data: [
            {
              status: 200,
              result: {
                contract: randomNftContract,
                tokenName: "CollectionName",
              },
            },
          ],
        });

        const result = await collectionMetadata({
          contract: randomNftContract,
          currencyId,
        });

        expect(result).toEqual({
          status: 200,
          result: {
            contract: randomNftContract,
            tokenName: "CollectionName",
          },
        });
      });
    });
  });
});
