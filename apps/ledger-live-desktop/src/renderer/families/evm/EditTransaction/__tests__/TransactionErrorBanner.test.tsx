import { NotEnoughGas, TransactionHasBeenValidatedError } from "@ledgerhq/errors";
import React from "react";
import { render } from "tests/testSetup";
import ErrorBanner from "~/renderer/components/ErrorBanner";
import { TransactionErrorBanner } from "../components/TransactionErrorBanner";

jest.mock("~/renderer/components/ErrorBanner", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="error-banner" />),
}));

describe("EVM TransactionErrorBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders TransactionHasBeenValidatedError when transaction is already validated", () => {
    render(
      <TransactionErrorBanner transactionHasBeenValidated errors={{ gasPrice: new Error("x") }} />,
    );

    expect(ErrorBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(TransactionHasBeenValidatedError),
      }),
      undefined,
    );
  });

  it("hides generic description for NotEnoughGas gasPrice errors", () => {
    const notEnoughGasError = new Error("not enough gas");
    Object.setPrototypeOf(notEnoughGasError, NotEnoughGas.prototype);

    render(
      <TransactionErrorBanner
        transactionHasBeenValidated={false}
        errors={{ gasPrice: notEnoughGasError }}
      />,
    );

    expect(ErrorBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        error: notEnoughGasError,
        fallback: expect.objectContaining({ description: expect.any(Object) }),
      }),
      undefined,
    );
  });

  it("renders first error when there is no special case", () => {
    const genericError = new Error("generic");

    render(
      <TransactionErrorBanner transactionHasBeenValidated={false} errors={{ fee: genericError }} />,
    );

    expect(ErrorBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        error: genericError,
      }),
      undefined,
    );
  });
});
