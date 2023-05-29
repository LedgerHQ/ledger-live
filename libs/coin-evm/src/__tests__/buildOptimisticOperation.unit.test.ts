import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import buildOptimisticOperation from "../buildOptimisticOperation";
import { makeAccount, makeTokenAccount } from "../testUtils";
import { Transaction as EvmTransaction } from "../types";
import { encodeOperationId } from "../../../operation";
import { getEstimatedFees } from "../logic";

const currency = getCryptoCurrencyById("ethereum");
const tokenCurrency = getTokenById("ethereum/erc20/usd__coin");
const tokenAccount = {
  ...makeTokenAccount(
    "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
    tokenCurrency
  ),
  balance: new BigNumber(150),
  spendableBalance: new BigNumber(150),
};
const account = makeAccount(
  "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
  currency,
  [tokenAccount]
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
    });
  });
});
