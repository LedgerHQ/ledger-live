const mockedData = {
  mockReturnValue1: {
    metadata: {
      contract: "0x6eecedfed50291ef8990460551466e8a6ffaa21c",
      tokenId: "0",
      tokenName: "Mocked NFT",
      nftName: "Mocked NFT",
      media:
        "https://ldg.mo.cloudinary.net/stg/preview/ethereum/1/0x6eecedfed50291ef8990460551466e8a6ffaa21c/0?resource_type=image",
      medias: {
        preview: {
          uri: "https://ldg.mo.cloudinary.net/stg/preview/ethereum/1/0x6eecedfed50291ef8990460551466e8a6ffaa21c/0?resource_type=image",
          mediaType: "image/png",
        },
        big: {
          uri: "https://ldg.mo.cloudinary.net/stg/big/ethereum/1/0x6eecedfed50291ef8990460551466e8a6ffaa21c/0?resource_type=image",
          mediaType: "image/png",
        },
        original: {
          uri: "https://ldg.mo.cloudinary.net/stg/original/ethereum/1/0x6eecedfed50291ef8990460551466e8a6ffaa21c/0?resource_type=image",
          mediaType: "image/png",
        },
      },
      description: null,
      tokenNameThumbnail: null,
      properties: [],
      links: {
        rarible: "https://rarible.com/token/0x6eecedfed50291ef8990460551466e8a6ffaa21c:0",
        opensea: "https://opensea.io/assets/ethereum/0x6eecedfed50291ef8990460551466e8a6ffaa21c/0",
        explorer: "https://etherscan.io/nft/0x6eecedfed50291ef8990460551466e8a6ffaa21c/0",
        etherscan: "https://etherscan.io/nft/0x6eecedfed50291ef8990460551466e8a6ffaa21c/0",
      },
      staxImage: null,
    },
    status: "loaded",
  },
  mockReturnValue2: {
    nfts: [
      {
        id: "js:2:ethereum:0xd4b6595ff5f3c21E0b00edB8947A31110a9c4B8f:+0x6209F12493CbFEE0D9eC53C3cd8D6B9e4Ad2Abaa+369+ethereum",
        tokenId: "369",
        amount: "1",
        contract: "0x6209F12493CbFEE0D9eC53C3cd8D6B9e4Ad2Abaa",
        standard: "ERC721",
        currencyId: "ethereum",
      },
    ],
    fetchNextPage: jest.fn(),
    hasNextPage: false,
  },
  mockReturnValue3: {
    contract: "0x21e6348da1793ce4700180ba56c627cea756f5c9",
    tokenName: "CryptoBots",
    namedTokens: true,
    image: {
      uri: "https://lh3.googleusercontent.com/Cu0ZOj_pEgHXemuoU5-jWOpxIvuIHdxcFFzWB2oxHy8H7jB4J3UvSKBVcD64N6YmRoJy_F1k7SUvilQXN3ueoN0a63YPykg06Q",
      mediaType: "image/jpeg",
    },
  },
};

export default mockedData;
