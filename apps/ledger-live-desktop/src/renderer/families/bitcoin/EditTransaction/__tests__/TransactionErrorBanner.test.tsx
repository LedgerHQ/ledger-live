import { TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import React from "react";
import { render } from "tests/testSetup";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { TransactionErrorBanner } from "../components/TransactionErrorBanner";

jest.mock("~/renderer/components/ErrorBanner", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="error-banner" />),
}));

describe("Bitcoin TransactionErrorBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders TransactionHasBeenValidatedError when transaction is already validated", () => {
    render(<TransactionErrorBanner transactionHasBeenValidated errors={{ fee: new Error("x") }} />);

    expect(ErrorBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(TransactionHasBeenValidatedError),
      }),
      undefined,
    );
  });

  it("renders first available error when transaction is not validated", () => {
    const replacementError = new Error("replacement underpriced");

    render(
      <TransactionErrorBanner
        transactionHasBeenValidated={false}
        errors={{ replacementTransactionUnderpriced: replacementError }}
      />,
    );

    expect(ErrorBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        error: replacementError,
      }),
      undefined,
    );
  });
});
