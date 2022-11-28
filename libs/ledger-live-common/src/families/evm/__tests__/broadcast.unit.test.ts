import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import buildOptimisticOperation from "../buildOptimisticOperation";
import { Transaction as EvmTransaction } from "../types";
import { encodeOperationId } from "../../../operation";
import { getEstimatedFees } from "../logic";
import { makeAccount } from "../testUtils";
import * as API from "../api/rpc.common";
import broadcast from "../broadcast";

const currency: CryptoCurrency = findCryptoCurrencyById("ethereum")!;
const account: Account = makeAccount(
  "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
  currency
);
const transaction: EvmTransaction = {
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
const estimatedFees = getEstimatedFees(transaction);
const optimisticOperation = buildOptimisticOperation(account, transaction);
const type = "OUT";
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
      it("should broadcast the transaction and fill the blank in the optimistic transaction", async () => {
        const finalOperation = await broadcast({
          account,
          signedOperation: {
            operation: optimisticOperation,
            signature: "0xS1gn4tUR3",
            expirationDate: null,
          },
        });

        expect(API.broadcastTransaction).toBeCalled();
        expect(finalOperation).toEqual({
          id: encodeOperationId(account.id, mockedBroadcastResponse.hash, type),
          hash: mockedBroadcastResponse.hash,
          blockNumber: mockedBroadcastResponse.blockNumber,
          blockHeight: mockedBroadcastResponse.blockNumber,
          blockHash: mockedBroadcastResponse.blockHash,
          value: transaction.amount.plus(estimatedFees),
          fee: estimatedFees,
          type,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: new Date(mockedBroadcastResponse.timestamp * 1000),
          extra: {},
        });
      });
    });
  });
});
