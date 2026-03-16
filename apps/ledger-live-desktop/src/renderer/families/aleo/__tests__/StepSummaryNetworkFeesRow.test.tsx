import BigNumber from "bignumber.js";
import React from "react";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { render, screen } from "tests/testSetup";
import StepSummaryNetworkFeesRow from "../StepSummaryNetworkFeesRow";
import { aleoCurrency } from "../__mocks__/currency.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import * as aleoUtils from "../shared/utils";

jest.mock("../shared/utils", () => {
  const actual = jest.requireActual("../shared/utils");

  return {
    ...actual,
    getAleoCurrencyConfig: jest.fn(actual.getAleoCurrencyConfig),
  };
});

const mockedGetAleoCurrencyConfig = jest.mocked(aleoUtils.getAleoCurrencyConfig);

describe("StepSummaryNetworkFeesRow", () => {
  beforeEach(() => {
    mockedGetAleoCurrencyConfig.mockReturnValue(undefined);
  });

  it("should render network fees row with private label for private transfer", () => {
    render(
      <StepSummaryNetworkFeesRow
        estimatedFees={new BigNumber(1)}
        feeTooHigh={new Error("fee too high")}
        feesCurrency={aleoCurrency}
        feesUnit={aleoCurrency.units[0]}
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE })}
      />,
    );

    expect(screen.getByText("Network fees")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("should render network fees row with public label for public transfer", () => {
    render(
      <StepSummaryNetworkFeesRow
        estimatedFees={new BigNumber(1)}
        feeTooHigh={new Error("fee too high")}
        feesCurrency={aleoCurrency}
        feesUnit={aleoCurrency.units[0]}
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC })}
      />,
    );

    expect(screen.getByText("Network fees")).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("should render network fees row with warning when feeTooHigh is provided", () => {
    render(
      <StepSummaryNetworkFeesRow
        estimatedFees={new BigNumber(1)}
        feeTooHigh={new Error("fee too high")}
        feesCurrency={aleoCurrency}
        feesUnit={aleoCurrency.units[0]}
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE })}
      />,
    );

    expect(screen.getByText("Network fees")).toBeInTheDocument();
    expect(screen.getByText("fee too high")).toBeInTheDocument();
  });

  it.each([
    {
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      balanceTypeLabel: "Private",
    },
    {
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      balanceTypeLabel: "Public",
    },
  ])(
    "should render sponsored network fees row for $balanceTypeLabel transaction",
    ({ mode, balanceTypeLabel }) => {
      mockedGetAleoCurrencyConfig.mockReturnValueOnce({
        status: { type: "active" },
        networkType: "mainnet",
        apiUrls: {
          node: "https://node.example",
          sdk: "https://sdk.example",
        },
        feeByTransactionType: {
          [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 1,
          [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 1,
          [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 1,
          [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 1,
        },
        feeSafetyMultiplier: 1,
        isFeeSponsored: true,
      });

      render(
        <StepSummaryNetworkFeesRow
          estimatedFees={new BigNumber(1)}
          feeTooHigh={new Error("fee too high")}
          feesCurrency={aleoCurrency}
          feesUnit={aleoCurrency.units[0]}
          transaction={makeAleoTransaction({ mode })}
        />,
      );

      expect(screen.getByText("Network fees")).toBeInTheDocument();
      expect(screen.getByText(balanceTypeLabel)).toBeInTheDocument();
      expect(screen.getByText("Covered by Provable")).toBeInTheDocument();
    },
  );
});
