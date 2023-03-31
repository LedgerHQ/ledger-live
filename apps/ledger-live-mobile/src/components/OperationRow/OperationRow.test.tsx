import * as React from "react";
import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/live-common/mock/account";

import { render } from "../../__test__/test-renderer";

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
  blockHeight: 0,
  blockHash: "",
  transactionSequenceNumber: undefined,
  date: new Date(),
  extra: {},
};

const ethereum = getCryptoCurrencyById("ethereum");

const mockedAccount = genAccount("js:1:ethereum:0xaccount", {
  currency: ethereum,
});

describe("OperationRow test (non optimistic operation)", () => {
  it("should render correctly", () => {
    const { getByTestId } = render(
      <OperationRow
        account={mockedAccount}
        parentAccount={null}
        operation={mockedOperation}
        isLast
      />,
    );

    const operationRowDate = getByTestId("operationRowDate");
    expect(operationRowDate).toBeVisible();
  });
});
