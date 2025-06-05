import { BigNumber } from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getTransactionExplorer } from "./logic";

describe("getTransactionExplorer", () => {
  test("Tx explorer URL is converted from hash to consensus timestamp", async () => {
    const explorerView = getCryptoCurrencyById("hedera").explorerViews[0];
    expect(explorerView).toBeDefined();
    expect(explorerView.tx).toBeDefined();

    const mockOperation: Operation = {
      extra: {
        consensusTimestamp: "1.2.3.4",
      },
      id: "",
      hash: "",
      type: "IN",
      value: new BigNumber(0),
      fee: new BigNumber(0),
      senders: [],
      recipients: [],
      blockHeight: undefined,
      blockHash: undefined,
      accountId: "",
      date: new Date(),
    };

    const newUrl = getTransactionExplorer(explorerView, mockOperation);
    expect(newUrl).toBe("https://hashscan.io/mainnet/transaction/1.2.3.4");
  });

  test("Tx explorer URL is based on transaction id if consensus timestamp is not available", async () => {
    const explorerView = getCryptoCurrencyById("hedera").explorerViews[0];
    expect(explorerView).toBeDefined();
    expect(explorerView.tx).toBeDefined();

    const mockOperation: Operation = {
      extra: {
        transactionId: "0.0.1234567-123-123",
      },
      id: "",
      hash: "",
      type: "IN",
      value: new BigNumber(0),
      fee: new BigNumber(0),
      senders: [],
      recipients: [],
      blockHeight: undefined,
      blockHash: undefined,
      accountId: "",
      date: new Date(),
    };

    const newUrl = getTransactionExplorer(explorerView, mockOperation);
    expect(newUrl).toBe("https://hashscan.io/mainnet/transaction/0.0.1234567-123-123");
  });
});
