import BigNumber from "bignumber.js";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "@ledgerhq/coin-framework/nft/nftOperationId";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { makeAccount, makeTokenAccount } from "../fixtures/common.fixtures";
import buildOptimisticOperation from "../../buildOptimisticOperation";
import { Transaction as EvmTransaction } from "../../types";
import * as API from "../../api/rpc/rpc.common";
import { getEstimatedFees } from "../../logic";
import broadcast from "../../broadcast";

const currency: CryptoCurrency = getCryptoCurrencyById("ethereum");
const tokenCurrency = getTokenById("ethereum/erc20/usd__coin");
const tokenAccount: TokenAccount = makeTokenAccount(
  "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
  tokenCurrency,
);
const account: Account = makeAccount(
  "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
  currency,
  [tokenAccount],
);
const mockedBroadcastResponse = {
  hash: "0xH4sH",
  blockNumber: 420,
  blockHash: "0xBl0cKH4sH",
  timestamp: Date.now() / 1000, // block timestamps are in seconds
};

describe("EVM Family", () => {
  describe("broadcast.ts", () => {
    beforeAll(() => {
      jest
        .spyOn(API, "broadcastTransaction")
        .mockImplementation(async () => mockedBroadcastResponse as any);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    describe("broadcast", () => {
      it("should broadcast the coin transaction and fill the blank in the optimistic transaction", async () => {
        const coinTransaction: EvmTransaction = {
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: "id",
          recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
          feesStrategy: "custom",
          family: "evm",
          mode: "send",
          nonce: 0,
          gasLimit: new BigNumber(21000),
          chainId: 1,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
          type: 2,
        };
        const estimatedFees = getEstimatedFees(coinTransaction);
        const optimisticCoinOperation = buildOptimisticOperation(account, coinTransaction);

        const finalOperation = await broadcast({
          account,
          signedOperation: {
            operation: optimisticCoinOperation,
            signature: "0xS1gn4tUR3",
            expirationDate: null,
          },
        });

        expect(API.broadcastTransaction).toBeCalled();
        expect(finalOperation).toEqual({
          id: encodeOperationId(account.id, mockedBroadcastResponse.hash, "OUT"),
          hash: mockedBroadcastResponse.hash,
          blockNumber: mockedBroadcastResponse.blockNumber,
          blockHeight: mockedBroadcastResponse.blockNumber,
          blockHash: mockedBroadcastResponse.blockHash,
          value: coinTransaction.amount.plus(estimatedFees),
          fee: estimatedFees,
          type: "OUT",
          senders: [account.freshAddress],
          recipients: [coinTransaction.recipient],
          accountId: account.id,
          transactionSequenceNumber: 0,
          subOperations: [],
          nftOperations: [],
          date: new Date(mockedBroadcastResponse.timestamp * 1000),
          extra: {},
        });
      });

      it("should broadcast the token transaction and fill the blank in the optimistic transaction", async () => {
        const tokenTransaction: EvmTransaction = {
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: tokenAccount.id,
          recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
          data: Buffer.from(
            "a9059cbb00000000000000000000000059569e96d0e3d9728dc07bf5c1443809e6f237fd0000000000000000000000000000000000000000000000000c06701668d322ac",
            "hex",
          ),
          feesStrategy: "custom",
          family: "evm",
          mode: "send",
          nonce: 0,
          gasLimit: new BigNumber(60000),
          chainId: 1,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
          type: 2,
        };
        const estimatedFees = getEstimatedFees(tokenTransaction);
        const optimisticTokenOperation = buildOptimisticOperation(account, tokenTransaction);

        const finalOperation = await broadcast({
          account,
          signedOperation: {
            operation: optimisticTokenOperation,
            signature: "0xS1gn4tUR3",
            expirationDate: null,
          },
        });

        expect(API.broadcastTransaction).toBeCalled();
        expect(finalOperation).toEqual({
          id: encodeOperationId(account.id, mockedBroadcastResponse.hash, "FEES"),
          hash: mockedBroadcastResponse.hash,
          blockNumber: mockedBroadcastResponse.blockNumber,
          blockHeight: mockedBroadcastResponse.blockNumber,
          blockHash: mockedBroadcastResponse.blockHash,
          value: estimatedFees,
          fee: estimatedFees,
          type: "FEES",
          senders: [account.freshAddress],
          recipients: [tokenCurrency?.contractAddress || ""],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: new Date(mockedBroadcastResponse.timestamp * 1000),
          nftOperations: [],
          subOperations: [
            {
              id: encodeOperationId(tokenAccount.id, mockedBroadcastResponse.hash, "OUT"),
              hash: mockedBroadcastResponse.hash,
              blockNumber: mockedBroadcastResponse.blockNumber,
              blockHeight: mockedBroadcastResponse.blockNumber,
              blockHash: mockedBroadcastResponse.blockHash,
              value: new BigNumber(100),
              fee: estimatedFees,
              type: "OUT",
              senders: [account.freshAddress],
              recipients: [tokenTransaction.recipient],
              accountId: tokenAccount.id,
              transactionSequenceNumber: 0,
              date: new Date(mockedBroadcastResponse.timestamp * 1000),
              contract: tokenAccount.token.contractAddress,
              extra: {},
            },
          ],
          extra: {},
        });
      });

      it("should broadcast the ERC721 transaction and fill the blank in the optimistic transaction", async () => {
        const nft = {
          contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
          tokenId: "1",
          quantity: new BigNumber(1),
          collectionName: "BAYC",
        };
        const erc721Transaction: EvmTransaction = {
          family: "evm",
          mode: "erc721",
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: tokenAccount.id,
          recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
          data: Buffer.from(
            "b88d4fde0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d4168000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000",
            "hex",
          ),
          feesStrategy: "custom",
          nonce: 0,
          gasLimit: new BigNumber(60000),
          chainId: 1,
          nft,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
          type: 2,
        };
        const estimatedFees = getEstimatedFees(erc721Transaction);
        const optimisticErc721Operation = buildOptimisticOperation(account, erc721Transaction);

        const finalOperation = await broadcast({
          account,
          signedOperation: {
            operation: optimisticErc721Operation,
            signature: "0xS1gn4tUR3",
            expirationDate: null,
          },
        });
        const nftId = encodeNftId(account.id, nft.contract, nft.tokenId, account.currency.id);

        expect(API.broadcastTransaction).toBeCalled();
        expect(finalOperation).toEqual({
          id: encodeOperationId(account.id, mockedBroadcastResponse.hash, "FEES"),
          hash: mockedBroadcastResponse.hash,
          blockNumber: mockedBroadcastResponse.blockNumber,
          blockHeight: mockedBroadcastResponse.blockNumber,
          blockHash: mockedBroadcastResponse.blockHash,
          value: estimatedFees,
          fee: estimatedFees,
          type: "FEES",
          senders: [account.freshAddress],
          recipients: [nft.contract],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: new Date(mockedBroadcastResponse.timestamp * 1000),
          subOperations: [],
          nftOperations: [
            {
              id: encodeERC721OperationId(nftId, mockedBroadcastResponse.hash, "NFT_OUT", 0),
              hash: mockedBroadcastResponse.hash,
              blockNumber: mockedBroadcastResponse.blockNumber,
              blockHeight: mockedBroadcastResponse.blockNumber,
              blockHash: mockedBroadcastResponse.blockHash,
              value: nft.quantity,
              fee: estimatedFees,
              type: "NFT_OUT",
              senders: [account.freshAddress],
              recipients: [erc721Transaction.recipient],
              accountId: account.id,
              transactionSequenceNumber: 0,
              date: new Date(mockedBroadcastResponse.timestamp * 1000),
              contract: nft.contract,
              tokenId: nft.tokenId,
              standard: "ERC721",
              extra: {},
            },
          ],
          extra: {},
        });
      });

      it("should broadcast the ERC1155 transaction and fill the blank in the optimistic transaction", async () => {
        const nft = {
          contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
          tokenId: "1",
          quantity: new BigNumber(10),
          collectionName: "BAYC",
        };
        const erc1155Transaction: EvmTransaction = {
          family: "evm",
          mode: "erc1155",
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: tokenAccount.id,
          recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
          data: Buffer.from(
            "f242432a0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d41680000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000",
            "hex",
          ),
          feesStrategy: "custom",
          nonce: 0,
          gasLimit: new BigNumber(60000),
          chainId: 1,
          nft,
          maxFeePerGas: new BigNumber(100),
          maxPriorityFeePerGas: new BigNumber(100),
          type: 2,
        };
        const estimatedFees = getEstimatedFees(erc1155Transaction);
        const optimisticErc721Operation = buildOptimisticOperation(account, erc1155Transaction);

        const finalOperation = await broadcast({
          account,
          signedOperation: {
            operation: optimisticErc721Operation,
            signature: "0xS1gn4tUR3",
            expirationDate: null,
          },
        });
        const nftId = encodeNftId(account.id, nft.contract, nft.tokenId, account.currency.id);

        expect(API.broadcastTransaction).toBeCalled();
        expect(finalOperation).toEqual({
          id: encodeOperationId(account.id, mockedBroadcastResponse.hash, "FEES"),
          hash: mockedBroadcastResponse.hash,
          blockNumber: mockedBroadcastResponse.blockNumber,
          blockHeight: mockedBroadcastResponse.blockNumber,
          blockHash: mockedBroadcastResponse.blockHash,
          value: estimatedFees,
          fee: estimatedFees,
          type: "FEES",
          senders: [account.freshAddress],
          recipients: [nft.contract],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: new Date(mockedBroadcastResponse.timestamp * 1000),
          subOperations: [],
          nftOperations: [
            {
              id: encodeERC1155OperationId(nftId, mockedBroadcastResponse.hash, "NFT_OUT", 0),
              hash: mockedBroadcastResponse.hash,
              blockNumber: mockedBroadcastResponse.blockNumber,
              blockHeight: mockedBroadcastResponse.blockNumber,
              blockHash: mockedBroadcastResponse.blockHash,
              value: nft.quantity,
              fee: estimatedFees,
              type: "NFT_OUT",
              senders: [account.freshAddress],
              recipients: [erc1155Transaction.recipient],
              accountId: account.id,
              transactionSequenceNumber: 0,
              date: new Date(mockedBroadcastResponse.timestamp * 1000),
              contract: nft.contract,
              tokenId: nft.tokenId,
              standard: "ERC1155",
              extra: {},
            },
          ],
          extra: {},
        });
      });
    });
  });
});
