import React from "react";
import { Account, Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { render } from "@testing-library/react-native";

import OperationRow from ".";

const mockedOperation: Operation = {
  accountId: "js:1:ethereum:0xaccount",
  id: "js:2:ethereum:0xa22CA840265d3C5CB1846e419B14c6a6CdD06FAB:",
  hash: "eth_one",
  type: "OUT",
  value: new BigNumber(6453567),
  fee: new BigNumber(4890),
  senders: ["0xsender"],
  recipients: ["0xrecipient"],
  blockHeight: null,
  blockHash: null,
  transactionSequenceNumber: undefined,
  date: new Date(),
  extra: {},
};

const ethereum = getCryptoCurrencyById("ethereum");

const mockedAccount: Account = {
  type: "Account",
  name: "Mock Ethereum Account",
  id: "js:1:ethereum:0xaccount",
  seedIdentifier: "",
  derivationMode: "",
  index: 0,
  freshAddress: "0xE9CAF97C863A92EBB4D76FF37EE71C84D7E09723",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [
    {
      address: "0xE9CAF97C863A92EBB4D76FF37EE71C84D7E09723",
      derivationPath: "44'/60'/0'/0/0",
    },
  ],
  starred: false,
  used: false,
  balance: new BigNumber(324567),
  spendableBalance: new BigNumber(2345674234),
  blockHeight: 100,
  creationDate: new Date(),
  currency: ethereum,
  unit: ethereum.units[0],
  operationsCount: 1,
  operations: [mockedOperation],
  pendingOperations: [],
  lastSyncDate: new Date(),
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  swapHistory: [],
};

describe("OperationRow test", () => {
  it("should render correctly", () => {
    render(
      <OperationRow
        account={mockedAccount}
        parentAccount={null}
        operation={mockedOperation}
        isLast
      />,
    );
    expect(true).toBe(true);
  });
});
