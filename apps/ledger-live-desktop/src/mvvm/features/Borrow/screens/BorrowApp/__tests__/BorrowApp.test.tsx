import React from "react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { render, screen } from "tests/testSetup";
import { BorrowApp } from "../index";
import { useBorrowAppViewModel } from "../useBorrowAppViewModel";

jest.mock("../useBorrowAppViewModel", () => ({
  useBorrowAppViewModel: jest.fn(),
}));

jest.mock("~/renderer/components/Web3AppWebview/NetworkError", () => ({
  NetworkErrorScreen: ({ refresh }: { refresh: () => void }) => (
    <button onClick={refresh} type="button">
      network error
    </button>
  ),
}));

jest.mock("LLD/features/Borrow/screens/BorrowWebView", () => ({
  BorrowWebView: () => <div data-testid="borrow-webview" />,
}));

type BorrowAppViewModel = ReturnType<typeof useBorrowAppViewModel>;

const baseViewModel: BorrowAppViewModel = {
  manifest: { id: "borrow", url: "https://borrow.example" } as LiveAppManifest,
  refreshManifests: jest.fn(),
  inputs: {} as BorrowAppViewModel["inputs"],
  enablePlatformDevTools: true,
  webviewAPIRef: { current: null },
  webviewState: {} as BorrowAppViewModel["webviewState"],
  onStateChange: jest.fn(),
  onBack: jest.fn(),
};

const mockViewModel = (overrides: Partial<BorrowAppViewModel> = {}) => {
  jest.mocked(useBorrowAppViewModel).mockReturnValue({ ...baseViewModel, ...overrides });
};

describe("BorrowApp", () => {
  it("renders network error when manifest is missing", () => {
    mockViewModel({ manifest: undefined, enablePlatformDevTools: false });

    render(<BorrowApp />);

    expect(screen.getByText("network error")).toBeVisible();
    expect(screen.queryByTestId("borrow-webview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-header")).not.toBeInTheDocument();
  });

  it("renders borrow webview and page header when manifest is available", () => {
    mockViewModel();

    render(<BorrowApp />);

    expect(screen.getByTestId("borrow-webview")).toBeVisible();
    expect(screen.getByTestId("page-header")).toBeVisible();
    expect(screen.queryByText("network error")).not.toBeInTheDocument();
  });

  it("invokes onBack from view model when the back button is clicked", async () => {
    const onBack = jest.fn();
    mockViewModel({ onBack });

    const { user } = render(<BorrowApp />);

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
