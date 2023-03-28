import { findCryptoCurrencyByTicker } from "@ledgerhq/cryptoassets";
import "../../../__tests__/test-helpers/setup";
import BigNumber from "bignumber.js";
import { encodeAccountId, toNFTRaw } from "../../../account";
import { ProtoNFT, Operation } from "@ledgerhq/types-live";
import { mergeNfts } from "../../../bridge/jsHelpers";
import {
  encodeNftId,
  getNftCapabilities,
  isNFTActive,
  isNftTransaction,
  nftsFromOperations,
} from "../../../nft";
import { Transaction } from "../types";
import { encodeERC1155OperationId } from "../../../nft/nftOperationId";

describe("nft merging", () => {
  const makeNFT = (
    tokenId: string,
    contract: string,
    amount: number
  ): ProtoNFT => ({
    id: encodeNftId("test", contract, tokenId, "ethereum"),
    tokenId,
    amount: new BigNumber(amount),
    contract,
    standard: "ERC721",
    currencyId: "ethereum",
  });
  const oldNfts = [
    makeNFT("1", "contract1", 10),
    makeNFT("2", "contract1", 1),
    makeNFT("3", "contract2", 6),
  ];

  test("should remove first NFT and return new array with same refs", () => {
    const nfts = [makeNFT("2", "contract1", 1), makeNFT("3", "contract2", 6)];
    const newNfts = mergeNfts(oldNfts, nfts);

    expect(newNfts.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[1]).toBe(newNfts[0]);
    expect(oldNfts[2]).toBe(newNfts[1]);
  });

  test("should remove any NFT and return new array with same refs", () => {
    const nfts = [makeNFT("1", "contract1", 10), makeNFT("3", "contract2", 6)];
    const newNfts = mergeNfts(oldNfts, nfts);

    expect(newNfts.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[0]).toBe(newNfts[0]);
    expect(oldNfts[2]).toBe(newNfts[1]);
  });

  test("should change NFT amount and return new array with new ref", () => {
    const nfts = [
      makeNFT("1", "contract1", 10),
      makeNFT("2", "contract1", 5),
      makeNFT("3", "contract2", 6),
    ];
    const addToNft1 = mergeNfts(oldNfts, nfts);

    expect(addToNft1.map(toNFTRaw)).toEqual(nfts.map(toNFTRaw));
    expect(oldNfts[0]).toBe(addToNft1[0]);
    expect(oldNfts[1]).not.toBe(addToNft1[1]);
    expect(oldNfts[2]).toBe(addToNft1[2]);
  });

  test("should add NFT and return new array with new ref", () => {
    const nfts = [
      makeNFT("1", "contract1", 10),
      makeNFT("2", "contract1", 1),
      makeNFT("3", "contract2", 6),
      makeNFT("4", "contract2", 4),
    ];
    const addToNft1 = mergeNfts(oldNfts, nfts);

    expect(addToNft1.map(toNFTRaw)).toEqual(
      [
        makeNFT("4", "contract2", 4),
        makeNFT("1", "contract1", 10),
        makeNFT("2", "contract1", 1),
        makeNFT("3", "contract2", 6),
      ].map(toNFTRaw)
    );
    expect(oldNfts[0]).toBe(addToNft1[1]);
    expect(oldNfts[1]).toBe(addToNft1[2]);
    expect(oldNfts[2]).toBe(addToNft1[3]);
    expect(addToNft1[0]).toBe(nfts[3]);
  });
});

describe("OpenSea lazy minting bs", () => {
  test("should have a correct on-chain nft amount even with OpenSea lazy minting", () => {
    const makeNftOperation = (
      params: [Operation["type"], number],
      index: number
    ): Operation => {
      const [type, value] = params;

      if (!["NFT_IN", "NFT_OUT"].includes(type)) {
        return {} as Operation;
      }

      const now = Date.now() + index;
      const currencyId = "polygon";
      const accountId = encodeAccountId({
        type: "type",
        xpubOrAddress: "0xbob",
        currencyId,
        derivationMode: "",
        version: "1",
      });
      const sender = type === "NFT_IN" ? "0xbob" : "0xkvn";
      const receiver = type === "NFT_IN" ? "0xkvn" : "0xbob";
      const contract = "0x0000000000000000000000000000000000000000";
      const fee = new BigNumber(0);
      const tokenId = "42069";
      const hash = "FaKeHasH" + now;
      const date = new Date(now);
      const nftId = encodeNftId(accountId, contract, tokenId, currencyId);

      return {
        id: encodeERC1155OperationId(nftId, hash, type),
        hash,
        senders: [sender],
        recipients: [receiver],
        contract,
        fee,
        standard: "ERC1155",
        tokenId,
        value: new BigNumber(value),
        type,
        accountId,
        date,
      } as Operation;
    };

    // scenario with bob lazy minting 10 NFTs
    const ops = (
      [
        ["NFT_OUT", 5], // lazy mint sending 5 NFT
        ["NFT_IN", 1], // receiving 1 of them back
        ["NFT_IN", 2], // receiving 2 of them back
        ["NFT_OUT", 2], // lazy mint sending 5 NFT (transformed by OpenSea in 2 txs) 1/2 (off-chain)
        ["NFT_OUT", 3], // lazy mint sending 5 NFT (transformed by OpenSea in 2 txs) 2/2 (on-chain)
        ["NFT_IN", 1], // receiving 1 back
      ] as [Operation["type"], number][]
    ).map((params, i) => makeNftOperation(params, i));

    // What happened for bob:
    //
    // -5 off-chain -> 0 on-chain (5 off-chain)
    // +1 on-chain -> 1 on-chain (5 off-chain)
    // +2 on-chain -> 3 on-chain (5 off-chain)
    // -2 off-chain & -3 on-chain -> 0 on-chain (3 off-chain)
    // +1 on-chain -> 1 on-chain (and 3 off-chain)

    const prevOperations = ops.slice(0);
    const nfts = nftsFromOperations(ops);
    expect(prevOperations).toEqual(ops); // ensure preserved order of operations
    expect(nfts[0].amount.toNumber()).toBe(1);
  });
});

describe("nft helpers", () => {
  describe("isNftTransaction ", () => {
    test("should return that it's an NFT transaction", () => {
      const transaction: Transaction = {
        family: "ethereum",
        mode: "erc721.transfer",
        amount: new BigNumber(0),
        recipient: "",
        gasPrice: null,
        userGasLimit: null,
        estimatedGasLimit: null,
        feeCustomUnit: null,
        networkInfo: null,
      };

      expect(isNftTransaction(transaction)).toEqual(true);
    });

    test("should return that it's not an NFT transaction", () => {
      const transaction: Transaction = {
        family: "ethereum",
        mode: "send",
        amount: new BigNumber(0),
        recipient: "",
        gasPrice: null,
        userGasLimit: null,
        estimatedGasLimit: null,
        feeCustomUnit: null,
        networkInfo: null,
      };

      expect(isNftTransaction(transaction)).toEqual(false);
    });

    test("should not throw with null or undefined", () => {
      expect(isNftTransaction(null)).toEqual(false);
      expect(isNftTransaction(undefined)).toEqual(false);
    });
  });

  describe("isNFTActive", () => {
    test("should return that's it's activated for ethereum", () => {
      const currency = findCryptoCurrencyByTicker("ETH");

      expect(isNFTActive(currency)).toBe(true);
    });

    test("should return that's it's not activated for ripple", () => {
      const currency = findCryptoCurrencyByTicker("XRP");

      expect(isNFTActive(currency)).toBe(false);
    });

    test("should not throw with null or undefined", () => {
      expect(isNFTActive(null)).toBe(false);
      expect(isNFTActive(undefined)).toBe(false);
    });
  });

  describe("getNftCapabilities", () => {
    test("should return the capabilities of an NFT ERC1155", () => {
      const nft: ProtoNFT = {
        id: "",
        contract: "",
        tokenId: "",
        amount: new BigNumber(0),
        currencyId: "ethereum",
        standard: "ERC1155",
      };

      expect(getNftCapabilities(nft)).toEqual(
        expect.objectContaining({
          hasQuantity: true,
        })
      );
    });

    test("should return the capabilities of an NFT ERC721", () => {
      const nft: ProtoNFT = {
        id: "",
        contract: "",
        tokenId: "",
        amount: new BigNumber(0),
        currencyId: "ethereum",
        standard: "ERC721",
      };

      expect(getNftCapabilities(nft)).toEqual(
        expect.objectContaining({
          hasQuantity: false,
        })
      );
    });

    test("should not throw with null or undefined", () => {
      expect(getNftCapabilities(null)).toMatchObject({});
      expect(getNftCapabilities(undefined)).toMatchObject({});
    });
  });
});
