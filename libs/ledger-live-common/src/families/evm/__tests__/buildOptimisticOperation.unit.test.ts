import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import buildOptimisticOperation from "../buildOptimisticOperation";
import { Transaction as EvmTransaction } from "../types";
import { encodeOperationId } from "../../../operation";
import { getEstimatedFees } from "../logic";
import { makeAccount } from "../testUtils";

const currency: CryptoCurrency = findCryptoCurrencyById("ethereum")!;
const account: Account = makeAccount(
  "0x813eC5fACF289bD41365A8F1C9038A1228E95201", // minus.eth
  currency
);
const transaction: EvmTransaction = {
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
const estimatedFees = getEstimatedFees(transaction);

describe("EVM Family", () => {
  describe("buildOptimisticOperation.ts", () => {
    describe("buildOptimisticOperation", () => {
      it("should create a an optimistic transaction waiting for the broadcast to be completed", () => {
        const optimistic = buildOptimisticOperation(account, transaction);
        const type = "OUT";

        expect(optimistic).toEqual({
          id: encodeOperationId(account.id, "", type),
          hash: "",
          type,
          value: transaction.amount.plus(estimatedFees),
          fee: estimatedFees,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          accountId: account.id,
          transactionSequenceNumber: 0,
          date: expect.any(Date),
          extra: {},
        });
      });
    });
  });
});
