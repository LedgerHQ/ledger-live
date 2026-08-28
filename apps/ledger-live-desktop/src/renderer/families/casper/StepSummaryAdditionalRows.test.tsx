/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "tests/testSetup";
import BigNumber from "bignumber.js";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";
import StepSummaryAdditionalRows from "./StepSummaryAdditionalRows";

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(),
}));

const { useFeature } = jest.requireMock("@features/platform-feature-flags");

const baseTransaction: Transaction = {
  family: "casper",
  amount: new BigNumber(0),
  fees: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  memoType: null,
  memoValue: null,
};

describe("StepSummaryAdditionalRows", () => {
  beforeEach(() => {
    useFeature.mockReturnValue({ enabled: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when lldMemoTag feature is enabled", () => {
    useFeature.mockReturnValue({ enabled: true });
    const { container } = render(
      <StepSummaryAdditionalRows transaction={{ ...baseTransaction, memoValue: "12345" }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it.each([null, undefined])("renders nothing when memoValue is %s", memoValue => {
    const { container } = render(
      <StepSummaryAdditionalRows transaction={{ ...baseTransaction, memoValue }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the transferId value when memoValue is set and flag is off", () => {
    render(
      <StepSummaryAdditionalRows
        transaction={{ ...baseTransaction, memoValue: "9007199254740993" }}
      />,
    );
    expect(screen.getByText("9007199254740993")).toBeInTheDocument();
  });
});
