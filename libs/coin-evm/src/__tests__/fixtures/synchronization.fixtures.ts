/* instanbul ignore file: don't test fixtures */

import BigNumber from "bignumber.js";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { encodeSubOperationId } from "@ledgerhq/coin-framework/operation";
import * as logic from "../../logic";
import {
  makeAccount,
  makeNft,
  makeNftOperation,
  makeOperation,
  makeTokenAccount,
} from "./common.fixtures";

jest.useFakeTimers().setSystemTime(new Date("2014-04-21"));

export const currency: CryptoCurrency = Object.freeze({
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
    node: {
      type: "external" as const,
      uri: "https://my-rpc.com",
    },
    explorer: {
      type: "etherscan" as const,
      uri: "https://api.com",
    },
  },
});

export const tokenCurrencies = [
  Object.freeze(getTokenById("ethereum/erc20/usd__coin")),
  Object.freeze(getTokenById("ethereum/erc20/usd_tether__erc20_")),
];

export const tokenAccount = makeTokenAccount("0xkvn", tokenCurrencies[0]);
export const account = Object.freeze({
  ...makeAccount("0xkvn", currency, [tokenAccount]),
  syncHash: logic.getSyncHash(currency),
});

export const coinOperations = [
  makeOperation({
    hash: "0xCoinOp1Hash",
    accountId: "js:2:ethereum:0xkvn:",
    blockHash: "0x8df71a12a8c06b36c06c26bf6248857dd2a2b75b6edbb4e33e9477078897b282",
    senders: ["0xd48f2332Eeed88243Cb6b1D0d65a10368A5370f0"], // johnnyhallyday.eth
    transactionSequenceNumber: 1,
    date: new Date(),
    blockHeight: 1,
  }),
  makeOperation({
    hash: "0xCoinOp2Hash",
    accountId: "js:2:ethereum:0xkvn:",
    transactionSequenceNumber: 2,
    date: new Date(Date.now() + 1),
    blockHeight: 100,
  }),
  makeOperation({
    hash: "0xCoinOp3Hash",
    accountId: "js:2:ethereum:0xkvn:",
    transactionSequenceNumber: 5,
    date: new Date(Date.now() + 2),
    blockHeight: 1000,
  }),
];

export const tokenOperations = [
  makeOperation({
    hash: coinOperations[0].hash, // on purpose to make this token op a subOp of coinOp 1
    accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin",
    blockHash: "0x95dc138a02c1b0e3fd49305f785e8e27e88a885004af13a9b4c62ad94eed07dd",
    recipients: ["0xB0B"],
    senders: ["0x9b744C0451D73C0958d8aA566dAd33022E4Ee797"], // sbf.eth
    contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    value: new BigNumber(152021496),
    fee: new BigNumber(1935663357068271),
    type: "OUT",
    date: new Date(),
    blockHeight: 10,
  }),
  makeOperation({
    hash: "0xTokenHashAga1n",
    accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin",
    contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    date: new Date(Date.now() + 1),
    blockHeight: 1000,
  }),
  makeOperation({
    hash: "0xTokenHashAga1n",
    accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin",
    contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    date: new Date(Date.now() + 2),
    blockHeight: 10000,
  }),
  makeOperation({
    hash: "0xTokenHashOtherToken",
    accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd_tether__erc20_",
    contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    date: new Date(Date.now() + 3),
    blockHeight: 11000,
  }),
];

export const erc721Operations = [
  makeNftOperation(
    {
      hash: coinOperations[0].hash, // on purpose to make this erc721 op an nftOp of coinOp 1
      accountId: coinOperations[0].accountId,
      blockHash: coinOperations[0].blockHash,
      recipients: ["0xB0B"],
      senders: ["0x1084b55cB63dE549806A521036F7dad2d37E3fAE"], // chocolatine.eth
      contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      tokenId: "1",
      standard: "ERC721",
      value: new BigNumber(1),
      fee: coinOperations[0].fee,
      type: "NFT_IN",
      date: coinOperations[0].date,
      blockHeight: coinOperations[0].blockHeight,
    },
    0,
  ),
  makeNftOperation(
    {
      hash: coinOperations[1].hash, // on purpose to make this erc721 op an nftOp of coinOp 1
      accountId: coinOperations[1].accountId,
      blockHash: coinOperations[1].blockHash,
      recipients: ["0xB0B"],
      senders: ["0x1084b55cB63dE549806A521036F7dad2d37E3fAE"], // chocolatine.eth
      contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      tokenId: "2",
      standard: "ERC721",
      value: new BigNumber(1),
      fee: coinOperations[1].fee,
      type: "NFT_IN",
      date: coinOperations[1].date,
      blockHeight: coinOperations[1].blockHeight,
    },
    0,
  ),
  makeNftOperation(
    {
      hash: coinOperations[1].hash, // on purpose to make this erc721 op an nftOp of coinOp 1
      accountId: coinOperations[1].accountId,
      blockHash: coinOperations[1].blockHash,
      recipients: ["0xB0B"],
      senders: ["0x1084b55cB63dE549806A521036F7dad2d37E3fAE"], // chocolatine.eth
      contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
      tokenId: "1",
      standard: "ERC721",
      value: new BigNumber(1),
      fee: coinOperations[1].fee,
      type: "NFT_OUT",
      date: coinOperations[1].date,
      blockHeight: coinOperations[1].blockHeight,
    },
    1,
  ),
];

export const erc1155Operations = [
  makeNftOperation(
    {
      hash: coinOperations[0].hash, // on purpose to make this erc1155 op an nftOp of coinOp 1
      accountId: "js:2:ethereum:0xkvn:",
      blockHash: "0x95dc138a02c1b0e3fd49305f785e8e27e88a885004af13a9b4c62ad94eed07dd",
      recipients: ["0xB0B"],
      senders: ["0x1084b55cB63dE549806A521036F7dad2d37E3fAE"], // painauchocolat.eth
      contract: "0xBa98C7d6B25309FF097e88D24400c0EbC4D68e3a",
      tokenId: "1",
      standard: "ERC1155",
      value: new BigNumber(10),
      fee: new BigNumber(1935663357068271),
      type: "NFT_IN",
      date: new Date(),
      blockHeight: 10,
    },
    0,
  ),
  makeNftOperation(
    {
      hash: coinOperations[1].hash, // on purpose to make this erc1155 op an nftOp of coinOp 1
      accountId: "js:2:ethereum:0xkvn:",
      blockHash: "0x95dc138a02c1b0e3fd49305f785e8e27e88a885004af13a9b4c62ad94eed07dd",
      recipients: ["0xB0B"],
      senders: ["0x1084b55cB63dE549806A521036F7dad2d37E3fAE"], // painauchocolat.eth
      contract: "0xBa98C7d6B25309FF097e88D24400c0EbC4D68e3a",
      tokenId: "1",
      standard: "ERC1155",
      value: new BigNumber(9),
      fee: new BigNumber(1935663357068271),
      type: "NFT_OUT",
      date: new Date(Date.now() + 1),
      blockHeight: 11,
    },
    0,
  ),
];

export const internalOperations = [
  makeOperation({
    hash: coinOperations[0].hash, // on purpose to make this internal op a subOp of coinOp 1
    accountId: coinOperations[0].accountId,
    blockHash: coinOperations[0].blockHash,
    recipients: ["0xB0B"],
    senders: ["0x9b744C0451D73C0958d8aA566dAd33022E4Ee797"], // sbf.eth
    value: new BigNumber(12),
    fee: new BigNumber(0),
    type: "NONE",
    date: new Date(),
    blockHeight: 10,
    id: encodeSubOperationId(coinOperations[0].accountId, coinOperations[0].hash, "NONE", 0),
  }),
  makeOperation({
    hash: coinOperations[1].hash, // on purpose to make this internal op a subOp of coinOp 1
    accountId: coinOperations[1].accountId,
    blockHash: coinOperations[1].blockHash,
    recipients: ["0xB0B"],
    senders: [coinOperations[1].recipients[0]],
    value: new BigNumber(34),
    fee: new BigNumber(0),
    type: "OUT",
    date: new Date(),
    blockHeight: 11,
    id: encodeSubOperationId(coinOperations[1].accountId, coinOperations[1].hash, "OUT", 0),
  }),
  makeOperation({
    hash: coinOperations[2].hash, // on purpose to make this internal op a subOp of coinOp 1
    accountId: coinOperations[2].accountId,
    blockHash: coinOperations[2].blockHash,
    recipients: [coinOperations[2].senders[0]],
    senders: ["0x9b744C0451D73C0958d8aA566dAd33022E4Ee797"], // sbf.eth
    value: new BigNumber(45),
    fee: new BigNumber(0),
    type: "IN",
    date: new Date(),
    blockHeight: 12,
    id: encodeSubOperationId(coinOperations[2].accountId, coinOperations[2].hash, "IN", 0),
  }),
];

export const ignoredTokenOperation = makeOperation({
  hash: "0xigN0r3Me",
  accountId: "js:2:ethereum:0xkvn:+ethereum%2Ferc20%2Fusd_tether__erc20_",
  contract: "0xUnknownContract",
  date: new Date(Date.now() + 4),
  blockHeight: 12000,
});

export const pendingOperation = makeOperation({
  hash: "123",
});

export const nfts = [
  makeNft({
    amount: new BigNumber("1"),
    contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    currencyId: "ethereum",
    id: "js:2:ethereum:0xkvn:+0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D+2+ethereum",
    standard: "ERC721",
    tokenId: "2",
  }),
  makeNft({
    amount: new BigNumber("1"),
    contract: "0xBa98C7d6B25309FF097e88D24400c0EbC4D68e3a",
    currencyId: "ethereum",
    id: "js:2:ethereum:0xkvn:+0xBa98C7d6B25309FF097e88D24400c0EbC4D68e3a+1+ethereum",
    standard: "ERC1155",
    tokenId: "1",
  }),
];
