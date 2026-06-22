import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import {
  getEstimatedSigningTime,
  isPublicTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../../../__mocks__/config.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";
import { getAleoCurrencyConfig, isAleoTransaction } from "../../../shared/utils";
import StepSummaryAdditionalRows from "./StepSummaryAdditionalRows";

jest.mock("@ledgerhq/live-common/families/aleo/utils");
jest.mock("../../../shared/utils", () => ({
  ...jest.requireActual("../../../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
  isAleoTransaction: jest.fn(),
}));

const mockedIsPublicTransaction = jest.mocked(isPublicTransaction);
const mockedGetEstimatedSigningTime = jest.mocked(getEstimatedSigningTime);
const mockedIsAleoTransaction = jest.mocked(isAleoTransaction);
const mockedGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

const defaultProps = {
  account: ALEO_ACCOUNT_1,
  parentAccount: null,
  status: {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  },
} as const;

describe("StepSummaryAdditionalRows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsAleoTransaction.mockReturnValue(true);
    mockedIsPublicTransaction.mockReturnValue(false);
    mockedGetEstimatedSigningTime.mockReturnValue("~30 sec");
    mockedGetAleoCurrencyConfig.mockReturnValue({
      ...mockAleoCoinConfig,
      recordPickingStrategy: "auto",
    });
  });

  it("should render nothing when recordPickingStrategy is manual", () => {
    mockedGetAleoCurrencyConfig.mockReturnValue({
      ...mockAleoCoinConfig,
      recordPickingStrategy: "manual",
    });

    const { container } = render(
      <StepSummaryAdditionalRows
        {...defaultProps}
        transaction={makeAleoTransaction({
          mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
          properties: {
            amountRecordCommitments: ["commitment1"],
            feeRecordCommitment: null,
          },
        })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render nothing when transaction is not an Aleo transaction", () => {
    mockedIsAleoTransaction.mockReturnValue(false);

    const { container } = render(
      <StepSummaryAdditionalRows {...defaultProps} transaction={makeAleoTransaction()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render nothing when transaction is a public transaction", () => {
    mockedIsPublicTransaction.mockReturnValue(true);

    const { container } = render(
      <StepSummaryAdditionalRows
        {...defaultProps}
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render nothing when transaction has no properties", () => {
    const { container } = render(
      <StepSummaryAdditionalRows
        {...defaultProps}
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render records used and signing time rows for a private transaction", () => {
    render(
      <StepSummaryAdditionalRows
        {...defaultProps}
        transaction={makeAleoTransaction({
          mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
          properties: {
            amountRecordCommitments: ["commitment1", "commitment2"],
            feeRecordCommitment: "feeCommitment",
          },
        })}
      />,
    );

    expect(screen.getByText("Records used")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Signing time")).toBeInTheDocument();
    expect(screen.getByText("~30 sec")).toBeInTheDocument();
  });

  it("should count only amount records when there is no fee record commitment", () => {
    render(
      <StepSummaryAdditionalRows
        {...defaultProps}
        transaction={makeAleoTransaction({
          mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
          properties: {
            amountRecordCommitments: ["commitment1"],
            feeRecordCommitment: null,
          },
        })}
      />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should call getEstimatedSigningTime with the correct record count and time labels", () => {
    render(
      <StepSummaryAdditionalRows
        {...defaultProps}
        transaction={makeAleoTransaction({
          mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
          properties: {
            amountRecordCommitments: ["commitment1"],
            feeRecordCommitment: "feeCommitment",
          },
        })}
      />,
    );

    expect(mockedGetEstimatedSigningTime).toHaveBeenCalledWith(2, "sec", "min");
  });
});
