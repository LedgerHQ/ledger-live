import React from "react";
import { render, screen } from "tests/testSetup";
import WebviewErrorDrawer from "./index";

jest.mock("~/renderer/analytics/TrackPage", () => ({
  __esModule: true,
  default: jest.fn(({ children }: { children?: React.ReactNode }) => <>{children}</>),
}));

jest.mock("../../utils/index", () => ({
  useGetSwapTrackingProperties: () => ({ swapVersion: "2", flow: "swap" }),
}));

/**
 * Drawer is invoked as <WebviewErrorDrawer {...props} /> where props is the error object.
 * So we pass an object with cause, message, etc. to simulate the error.
 */
function renderDrawer(props?: Error) {
  return render(<WebviewErrorDrawer {...(props ?? new Error())} />);
}

describe("WebviewErrorDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render default title and description when no error is passed", () => {
    renderDrawer(undefined);

    expect(screen.getByText("Sorry, try again.")).toBeVisible();
    expect(
      screen.getByText(/The server could not handle your request. Please try again later/),
    ).toBeVisible();
  });

  it("should render default content when error has no cause", () => {
    renderDrawer(new Error("Something failed"));

    expect(screen.getByText("Sorry, try again.")).toBeVisible();
    expect(
      screen.getByText(/The server could not handle your request. Please try again later/),
    ).toBeVisible();
  });

  it("should show error code section when cause.swapCode is set and not swap010", () => {
    const error = Object.assign(new Error("Payload failed"), {
      cause: { swapCode: "swap001" },
    });
    renderDrawer(error);

    expect(screen.getByText(/swap001|error code/i)).toBeVisible();
  });

  it("should show rate expired title and description when messageKey is WRONG_OR_EXPIRED_RATE_ID", () => {
    const error = Object.assign(new Error("Rate expired"), {
      cause: {
        response: {
          data: {
            error: { messageKey: "WRONG_OR_EXPIRED_RATE_ID" },
          },
        },
      },
    });
    renderDrawer(error);

    expect(screen.getByText("Rate Expired")).toBeVisible();
    expect(screen.getByText(/Exchange rate expired. Please refresh and try again/)).toBeVisible();
  });

  it("should show transaction cannot be created title and translated description when messageKey is TRANSACTION_CANNOT_BE_CREATED", () => {
    const error = Object.assign(new Error("Tx creation failed"), {
      cause: {
        response: {
          data: {
            error: { messageKey: "TRANSACTION_CANNOT_BE_CREATED" },
          },
        },
      },
    });
    renderDrawer(error);

    expect(screen.getByText("Processing Error")).toBeVisible();
    expect(
      screen.getByText(/The swap provider cannot process this transaction. Error code/),
    ).toBeVisible();
  });

  it("should show swap quote low liquidity title and description when messageKey is SWAP_QUOTE_LOW_LIQUIDITY", () => {
    const error = Object.assign(new Error("Low liquidity"), {
      cause: {
        messageKey: "SWAP_QUOTE_LOW_LIQUIDITY",
      },
    });
    renderDrawer(error);

    expect(screen.getByText("Partner unavailable")).toBeVisible();
    expect(
      screen.getByText(
        /We cannot complete your swap with this partner. Please try with another one/,
      ),
    ).toBeVisible();
  });

  it("should still show error code section when messageKey is set", () => {
    const error = Object.assign(new Error("Rate expired"), {
      cause: {
        swapCode: "swap001",
        response: {
          data: {
            error: { messageKey: "WRONG_OR_EXPIRED_RATE_ID" },
          },
        },
      },
    });
    renderDrawer(error);

    expect(screen.getByText("Rate Expired")).toBeVisible();
    expect(screen.getByText(/Exchange rate expired/)).toBeVisible();
    expect(screen.getByText(/swap001/)).toBeVisible();
  });

  it("should not show correlationId when swapCode is not set", () => {
    const error = Object.assign(new Error("Something failed"), {
      cause: { correlationId: "req-abc-123" },
    });
    renderDrawer(error);

    expect(screen.queryByText(/req-abc-123/)).not.toBeInTheDocument();
  });

  it("should not show errorMessage when cause.message is set", () => {
    const error = Object.assign(new Error("Outer message"), {
      cause: { message: "Backend validation failed" },
    });
    renderDrawer(error);

    expect(screen.queryByText(/Backend validation failed/)).not.toBeInTheDocument();
  });

  it("should show correlationId after swapCode when both are set", () => {
    const error = Object.assign(new Error("Payload failed"), {
      cause: {
        swapCode: "swap002",
        correlationId: "trace-xyz-456",
        message: "Failed to fetch payload",
      },
    });
    renderDrawer(error);

    expect(screen.getByText(/swap002|error code/i)).toBeVisible();
    expect(screen.getByText(/trace-xyz-456/)).toBeVisible();
    expect(screen.queryByText(/Failed to fetch payload/)).not.toBeInTheDocument();
  });

  it("should not show correlationId or errorMessage when messageKey overrides content", () => {
    const error = Object.assign(new Error("Rate expired"), {
      cause: {
        correlationId: "req-hidden",
        message: "Hidden message",
        response: {
          data: {
            error: { messageKey: "WRONG_OR_EXPIRED_RATE_ID" },
          },
        },
      },
    });
    renderDrawer(error);

    expect(screen.getByText("Rate Expired")).toBeVisible();
    expect(screen.queryByText(/req-hidden/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hidden message/)).not.toBeInTheDocument();
  });
});
