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

describe("BorrowApp", () => {
  it("renders network error when manifest is missing", () => {
    jest.mocked(useBorrowAppViewModel).mockReturnValue({
      manifest: undefined,
      refreshManifests: jest.fn(),
      inputs: {} as ReturnType<typeof useBorrowAppViewModel>["inputs"],
      enablePlatformDevTools: false,
      webviewAPIRef: { current: null },
      webviewState: {} as ReturnType<typeof useBorrowAppViewModel>["webviewState"],
      onStateChange: jest.fn(),
      onBack: jest.fn(),
    });

    render(<BorrowApp />);

    expect(screen.getByText("network error")).toBeVisible();
    expect(screen.queryByTestId("borrow-webview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-header")).not.toBeInTheDocument();
  });

  it("renders borrow webview and page header when manifest is available", () => {
    jest.mocked(useBorrowAppViewModel).mockReturnValue({
      manifest: { id: "borrow", url: "https://borrow.example" } as LiveAppManifest,
      refreshManifests: jest.fn(),
      inputs: {} as ReturnType<typeof useBorrowAppViewModel>["inputs"],
      enablePlatformDevTools: true,
      webviewAPIRef: { current: null },
      webviewState: {} as ReturnType<typeof useBorrowAppViewModel>["webviewState"],
      onStateChange: jest.fn(),
      onBack: jest.fn(),
    });

    render(<BorrowApp />);

    expect(screen.getByTestId("borrow-webview")).toBeVisible();
    expect(screen.getByTestId("page-header")).toBeVisible();
    expect(screen.queryByText("network error")).not.toBeInTheDocument();
  });

  it("invokes onBack from view model when the back button is clicked", async () => {
    const onBack = jest.fn();
    jest.mocked(useBorrowAppViewModel).mockReturnValue({
      manifest: { id: "borrow", url: "https://borrow.example" } as LiveAppManifest,
      refreshManifests: jest.fn(),
      inputs: {} as ReturnType<typeof useBorrowAppViewModel>["inputs"],
      enablePlatformDevTools: true,
      webviewAPIRef: { current: null },
      webviewState: {} as ReturnType<typeof useBorrowAppViewModel>["webviewState"],
      onStateChange: jest.fn(),
      onBack,
    });

    const { user } = render(<BorrowApp />);

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
