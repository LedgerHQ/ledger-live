import React from "react";
import { render, screen } from "tests/testSetup";
import { HistoryButton } from "../HistoryButton";
import { useHistory } from "../../hooks/useHistory";
import { Clock } from "@ledgerhq/lumen-ui-react/symbols";

jest.mock("../../hooks/useHistory");

const mockHandleHistory = jest.fn();

const setupMock = (hasUnread: boolean) => {
  jest.mocked(useHistory).mockReturnValue({
    handleHistory: mockHandleHistory,
    historyIcon: Clock,
    hasUnread,
    cta: "History",
  });
};

describe("HistoryButton", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the History button", () => {
    setupMock(false);
    render(<HistoryButton />);

    expect(screen.getByTestId("topbar-action-button-history")).toBeInTheDocument();
  });

  it("does not show the unread indicator when hasUnread is false", () => {
    setupMock(false);
    render(<HistoryButton />);

    expect(screen.queryByTestId("unread-indicator")).not.toBeInTheDocument();
  });

  it("shows the unread indicator when hasUnread is true", () => {
    setupMock(true);
    render(<HistoryButton />);

    expect(screen.getByTestId("unread-indicator")).toBeInTheDocument();
  });

  it("calls handleHistory when clicked", async () => {
    setupMock(false);
    const { user } = render(<HistoryButton />);

    await user.click(screen.getByTestId("topbar-action-button-history"));
    expect(mockHandleHistory).toHaveBeenCalledTimes(1);
  });
});
