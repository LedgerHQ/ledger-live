import BigNumber from "bignumber.js";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import buildOptimisticOperation from "../buildOptimisticOperation";
import { Transaction as EvmTransaction } from "../types";
import { encodeOperationId } from "../../../operation";
import { getEstimatedFees } from "../logic";
import { makeAccount, makeTokenAccount } from "../testUtils";
import * as API from "../api/rpc.common";
import broadcast from "../broadcast";

const currency: CryptoCurrency = getCryptoCurrencyById("ethereum");
const tokenCurrency = getTokenById("ethereum/erc20/usd__coin");
const tokenAccount: TokenAccount = makeTokenAccount(
  "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
  tokenCurrency
);
const account: Account = makeAccount(
  "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
  currency,
  [tokenAccount]
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
        const optimisticCoinOperation = buildOptimisticOperation(
          account,
          coinTransaction
        );

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
          id: encodeOperationId(
            account.id,
            mockedBroadcastResponse.hash,
            "OUT"
          ),
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
            "hex"
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
        const optimisticTokenOperation = buildOptimisticOperation(
          account,
          tokenTransaction
        );

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
          id: encodeOperationId(
            account.id,
            mockedBroadcastResponse.hash,
            "FEES"
          ),
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
          subOperations: [
            {
              id: encodeOperationId(
                tokenAccount.id,
                mockedBroadcastResponse.hash,
                "OUT"
              ),
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
    });
  });
});
