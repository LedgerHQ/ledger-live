/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "tests/testSetup";
import BigNumber from "bignumber.js";
import type { CasperOperation } from "@ledgerhq/live-common/families/casper/types";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra } = operationDetails;

const baseOperation: CasperOperation = {
  id: "casper--OUT",
  hash: "",
  type: "OUT",
  value: new BigNumber(0),
  fee: new BigNumber(0),
  blockHash: null,
  blockHeight: null,
  senders: [],
  recipients: [],
  accountId: "casper-account",
  date: new Date(),
  extra: {},
};

const mockAccount = { id: "casper-account" } as any;

describe("OperationDetailsExtra", () => {
  it("renders the transferId when present in extra", () => {
    render(
      <OperationDetailsExtra
        account={mockAccount}
        operation={{ ...baseOperation, extra: { transferId: "9007199254740993" } }}
        type="OUT"
      />,
    );
    expect(screen.getByText("9007199254740993")).toBeInTheDocument();
  });

  it("renders nothing when transferId is absent from extra", () => {
    const { container } = render(
      <OperationDetailsExtra account={mockAccount} operation={baseOperation} type="OUT" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
