import React from "react";
import { render, screen } from "tests/testSetup";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { ZcashSyncNotice } from "../ZcashSyncNotice";

jest.mock("../../../context/SendFlowContext", () => ({
  useSendFlowData: jest.fn(),
}));

jest.mock("~/renderer/families/bitcoin/ZcashSyncStateBanner", () => ({
  __esModule: true,
  default: ({
    account,
    sender,
  }: {
    account: { privateInfo?: { syncState?: string } };
    sender?: string;
  }) => {
    if (sender !== "private") return null;
    const syncState = account?.privateInfo?.syncState;
    if (!syncState || syncState === "complete") return null;
    if (syncState === "running")
      return React.createElement("div", { "data-testid": "zcash-sync-banner-running" });
    if (syncState === "stopped" || syncState === "disabled")
      return React.createElement("div", { "data-testid": "zcash-sync-banner-stopped" });
    if (syncState === "outdated")
      return React.createElement("div", { "data-testid": "zcash-sync-banner-outdated" });
    return null;
  },
}));

const mockUseSendFlowData = jest.mocked(useSendFlowData);

const buildState = (
  currencyId: string,
  sender: "public" | "private" | undefined,
  syncState?: string,
) =>
  ({
    state: {
      account: {
        account: {
          id: "mock-account-id",
          type: "Account",
          currency: { id: currencyId },
          privateInfo:
            syncState !== undefined
              ? {
                  syncState,
                  progress: 50,
                  estimatedTimeRemaining: { hours: 0, minutes: 5 },
                  lastSyncError: null,
                }
              : undefined,
        },
        parentAccount: null,
        currency: { id: currencyId },
      },
      transaction: {
        transaction: sender !== undefined ? { family: "bitcoin", sender } : { family: "bitcoin" },
        status: { errors: {}, warnings: {} },
      },
      recipient: null,
    },
    uiConfig: {},
    recipientSearch: { value: "", setValue: jest.fn(), clear: jest.fn() },
    isRecipientAddressComplete: false,
  }) as never;

describe("ZcashSyncNotice", () => {
  it("renders nothing for a non-Zcash account", () => {
    mockUseSendFlowData.mockReturnValue(buildState("ethereum", "private", "running"));
    const { container } = render(<ZcashSyncNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when sender is public", () => {
    mockUseSendFlowData.mockReturnValue(buildState("zcash", "public", "running"));
    const { container } = render(<ZcashSyncNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders running banner when Zcash + private sender + syncState=running", () => {
    mockUseSendFlowData.mockReturnValue(buildState("zcash", "private", "running"));
    render(<ZcashSyncNotice />);
    expect(screen.getByTestId("zcash-sync-banner-running")).toBeInTheDocument();
  });

  it("renders stopped banner when Zcash + private sender + syncState=stopped", () => {
    mockUseSendFlowData.mockReturnValue(buildState("zcash", "private", "stopped"));
    render(<ZcashSyncNotice />);
    expect(screen.getByTestId("zcash-sync-banner-stopped")).toBeInTheDocument();
  });

  it("renders nothing when Zcash + private sender + syncState=complete", () => {
    mockUseSendFlowData.mockReturnValue(buildState("zcash", "private", "complete"));
    const { container } = render(<ZcashSyncNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders stopped banner when Zcash + private sender + syncState=disabled", () => {
    mockUseSendFlowData.mockReturnValue(buildState("zcash", "private", "disabled"));
    render(<ZcashSyncNotice />);
    expect(screen.getByTestId("zcash-sync-banner-stopped")).toBeInTheDocument();
  });
});
