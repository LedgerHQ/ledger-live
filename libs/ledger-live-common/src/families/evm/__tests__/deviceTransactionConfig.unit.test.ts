import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import getDeviceTransactionConfig from "../deviceTransactionConfig";
import getTransactionStatus from "../getTransactionStatus";
import { Transaction as EvmTransaction } from "../types";
import { makeAccount } from "../testUtils";

const currency: CryptoCurrency = findCryptoCurrencyById("ethereum")!;
const account: Account = makeAccount("0xkvn", currency);
const transaction: EvmTransaction = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "0x997e135e96114c0E84FFc58754552368E4abf329", // celinedion.eth
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

describe("EVM Family", () => {
  describe("deviceTransactionConfig.ts", () => {
    describe("getDeviceTransactionConfig", () => {
      it("should return the right fields and infos for a transaction mode 'send'", async () => {
        const status = await getTransactionStatus(account, transaction);

        expect(
          getDeviceTransactionConfig({
            account,
            transaction,
            status,
          })
        ).toEqual([
          { type: "amount", label: "Amount" },
          { type: "address", label: "Address", address: transaction.recipient },
          {
            type: "text",
            label: "Network",
            value: currency.name.replace("Lite", "").trim(),
          },
          { type: "fees", label: "Max fees" },
        ]);
      });
    });
  });
});
