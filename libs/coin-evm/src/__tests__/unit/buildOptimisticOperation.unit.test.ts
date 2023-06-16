import BigNumber from "bignumber.js";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "@ledgerhq/coin-framework/nft/nftOperationId";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { makeAccount, makeTokenAccount } from "../fixtures/common.fixtures";
import buildOptimisticOperation from "../../buildOptimisticOperation";
import { Transaction as EvmTransaction } from "../../types";
import { getEstimatedFees } from "../../logic";

const currency = getCryptoCurrencyById("ethereum");
const tokenCurrency = getTokenById("ethereum/erc20/usd__coin");
const tokenAccount = {
  ...makeTokenAccount(
    "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
    tokenCurrency,
  ),
  balance: new BigNumber(150),
  spendableBalance: new BigNumber(150),
};
const account = makeAccount(
  "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
  currency,
  [tokenAccount],
);

describe("EVM Family", () => {
  describe("buildOptimisticOperation.ts", () => {
    describe("buildOptimisticOperation", () => {
      it("should create a coin optimistic transaction waiting for the broadcast to be completed", () => {
        const coinTransaction: EvmTransaction = {
          amount: new BigNumber(100),
          useAllAmount: false,
          subAccountId: "id",
          recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29", // cortex.eth
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
        const optimistic = buildOptimisticOperation(account, coinTransaction);
        const estimatedFees = getEstimatedFees(coinTransaction);
        const type = "OUT";

        expect(optimistic).toEqual({
          id: encodeOperationId(account.id, "", type),
          hash: "",
          type,
          value: coinTransaction.amount.plus(estimatedFees),
          fee: estimatedFees,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [coinTransaction.recipient],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: expect.any(Date),
          extra: {},
        });
      });

      it("should create a token optimistic transaction waiting for the broadcast to be completed", () => {
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
        const optimistic = buildOptimisticOperation(account, tokenTransaction);

        expect(optimistic).toEqual({
          id: encodeOperationId(account.id, "", "FEES"),
          hash: "",
          type: "FEES",
          value: estimatedFees,
          fee: estimatedFees,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [tokenCurrency.contractAddress],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: expect.any(Date),
          subOperations: [
            {
              id: encodeOperationId(tokenAccount.id, "", "OUT"),
              hash: "",
              type: "OUT",
              value: tokenTransaction.amount,
              fee: estimatedFees,
              blockHash: null,
              blockHeight: null,
              senders: [account.freshAddress],
              recipients: [tokenTransaction.recipient],
              accountId: tokenAccount.id,
              transactionSequenceNumber: 0,
              date: expect.any(Date),
              contract: tokenAccount.token.contractAddress,
              extra: {},
            },
          ],
          extra: {},
        });
      });

      it("should create a token optimistic transaction with useAllAmount waiting for the broadcast to be completed", () => {
        const tokenTransaction: EvmTransaction = {
          amount: new BigNumber(0),
          useAllAmount: true,
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
        const optimistic = buildOptimisticOperation(account, tokenTransaction);

        expect(optimistic).toEqual({
          id: encodeOperationId(account.id, "", "FEES"),
          hash: "",
          type: "FEES",
          value: estimatedFees,
          fee: estimatedFees,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [tokenCurrency.contractAddress],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: expect.any(Date),
          subOperations: [
            {
              id: encodeOperationId(tokenAccount.id, "", "OUT"),
              hash: "",
              type: "OUT",
              value: account.subAccounts?.[0]?.balance || new BigNumber(150),
              fee: estimatedFees,
              blockHash: null,
              blockHeight: null,
              senders: [account.freshAddress],
              recipients: [tokenTransaction.recipient],
              accountId: tokenAccount.id,
              transactionSequenceNumber: 0,
              date: expect.any(Date),
              contract: tokenAccount.token.contractAddress,
              extra: {},
            },
          ],
          extra: {},
        });
      });

      it("should create an ERC721 optimistic transaction waiting for the broadcast to be completed", () => {
        const nft = {
          contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
          tokenId: "1",
          quantity: new BigNumber(1),
          collectionName: "BAYC",
        };
        const erc721Transaction: EvmTransaction = {
          family: "evm",
          mode: "erc721",
          amount: new BigNumber(0),
          useAllAmount: false,
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
        const optimistic = buildOptimisticOperation(account, erc721Transaction);
        const nftId = encodeNftId(account.id, nft.contract, nft.tokenId, account.currency.id);

        expect(optimistic).toEqual({
          id: encodeOperationId(account.id, "", "FEES"),
          hash: "",
          type: "FEES",
          value: estimatedFees,
          fee: estimatedFees,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [nft.contract],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: expect.any(Date),
          nftOperations: [
            {
              id: encodeERC721OperationId(nftId, "", "NFT_OUT", 0),
              hash: "",
              type: "NFT_OUT",
              value: nft.quantity,
              fee: estimatedFees,
              blockHash: null,
              blockHeight: null,
              senders: [account.freshAddress],
              recipients: [erc721Transaction.recipient],
              accountId: account.id,
              transactionSequenceNumber: 0,
              date: expect.any(Date),
              contract: nft.contract,
              standard: "ERC721",
              tokenId: nft.tokenId,
              extra: {},
            },
          ],
          extra: {},
        });
      });

      it("should create an ERC1155 optimistic transaction waiting for the broadcast to be completed", () => {
        const nft = {
          contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
          tokenId: "1",
          quantity: new BigNumber(10),
          collectionName: "BAYC",
        };
        const erc1155Transaction: EvmTransaction = {
          family: "evm",
          mode: "erc1155",
          amount: new BigNumber(0),
          useAllAmount: false,
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
        const estimatedFees = getEstimatedFees(erc1155Transaction);
        const optimistic = buildOptimisticOperation(account, erc1155Transaction);
        const nftId = encodeNftId(account.id, nft.contract, nft.tokenId, account.currency.id);

        expect(optimistic).toEqual({
          id: encodeOperationId(account.id, "", "FEES"),
          hash: "",
          type: "FEES",
          value: estimatedFees,
          fee: estimatedFees,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [nft.contract],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: expect.any(Date),
          nftOperations: [
            {
              id: encodeERC1155OperationId(nftId, "", "NFT_OUT", 0),
              hash: "",
              type: "NFT_OUT",
              value: nft.quantity,
              fee: estimatedFees,
              blockHash: null,
              blockHeight: null,
              senders: [account.freshAddress],
              recipients: [erc1155Transaction.recipient],
              accountId: account.id,
              transactionSequenceNumber: 0,
              date: expect.any(Date),
              contract: nft.contract,
              standard: "ERC1155",
              tokenId: nft.tokenId,
              extra: {},
            },
          ],
          extra: {},
        });
      });
    });
  });
});
