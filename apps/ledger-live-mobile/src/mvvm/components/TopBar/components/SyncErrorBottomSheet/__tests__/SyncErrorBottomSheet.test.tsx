import React from "react";
import { renderWithReactQuery } from "@tests/test-renderer";
import { SyncErrorBottomSheetContent } from "../SyncErrorBottomSheetContent";

describe("SyncErrorBottomSheetContent", () => {
  const onClose = jest.fn();
  const onTryRefresh = jest.fn();

  const defaultProps = {
    onClose,
    onTryRefresh,
    listOfErrorAccountNames: "BTC1/ETH1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, account names and both buttons, and handles interactions correctly", async () => {
    const { user, getByText } = renderWithReactQuery(
      <SyncErrorBottomSheetContent {...defaultProps} />,
    );

    expect(getByText("Some account data couldn\u2019t load")).toBeVisible();
    expect(getByText(/BTC1\/ETH1/)).toBeVisible();
    expect(getByText("Try to refresh")).toBeVisible();
    expect(getByText("Close")).toBeVisible();

    await user.press(getByText("Try to refresh"));
    expect(onTryRefresh).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    jest.clearAllMocks();

    await user.press(getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onTryRefresh).not.toHaveBeenCalled();
  });
});
