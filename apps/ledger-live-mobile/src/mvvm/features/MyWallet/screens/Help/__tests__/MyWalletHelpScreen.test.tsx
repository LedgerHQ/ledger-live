import React from "react";
import { Linking } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { MyWalletHelpScreen } from "../index";
import { urls } from "~/utils/urls";

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = require("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
  };
});

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const { View } = require("react-native");
  return function MockQueuedDrawerBottomSheet({
    children,
    isRequestingToBeOpened,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened: boolean;
  }) {
    if (!isRequestingToBeOpened) return null;
    return <View testID="queued-drawer-bottom-sheet">{children}</View>;
  };
});

const mockExportLogs = jest.fn();
jest.mock("~/components/useExportLogs", () => ({
  __esModule: true,
  default: () => mockExportLogs,
}));

jest.mock("~/actions/general", () => ({
  useCleanCache: jest.fn(() => jest.fn()),
}));

describe("MyWalletHelpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it("should render both section headers", () => {
    render(<MyWalletHelpScreen />);

    expect(screen.getByText("Support and learning")).toBeVisible();
    expect(screen.getByText("More")).toBeVisible();
  });

  it("should render all sections and rows, and open correct URLs on press", async () => {
    const { user } = render(<MyWalletHelpScreen />);

    expect(screen.getByTestId("my-wallet-help-screen")).toBeVisible();
    expect(screen.getByText(/support and learning/i)).toBeVisible();
    expect(screen.getByText(/more/i)).toBeVisible();
    expect(screen.getByText(/ledger support/i)).toBeVisible();
    expect(screen.getByText(/get help with our faqs or chat/i)).toBeVisible();
    expect(screen.getByText(/ledger academy/i)).toBeVisible();
    expect(screen.getByText(/learn crypto/i)).toBeVisible();

    await user.press(screen.getByTestId("help-ledger-support-row"));
    expect(Linking.openURL).toHaveBeenCalledWith(urls.faq);

    await user.press(screen.getByTestId("help-ledger-academy-row"));
    expect(Linking.openURL).toHaveBeenCalledWith(urls.resources.ledgerAcademy);
  });

  it("should render Save logs row", () => {
    render(<MyWalletHelpScreen />);

    expect(screen.getByText("Save logs")).toBeVisible();
    expect(screen.getByText("Save Ledger Wallet logs for troubleshooting")).toBeVisible();
  });

  it("should render Ledger Status row", () => {
    render(<MyWalletHelpScreen />);

    expect(screen.getByText("Ledger Status")).toBeVisible();
    expect(screen.getByText("Check our system status")).toBeVisible();
  });

  it("should render Clear cache row", () => {
    render(<MyWalletHelpScreen />);

    expect(screen.getByText("Clear cache")).toBeVisible();
    expect(screen.getByText("Scan transactions and recalculate balances")).toBeVisible();
  });

  it("should call export logs when Save logs is pressed", async () => {
    const { user } = render(<MyWalletHelpScreen />);

    await user.press(screen.getByTestId("help-save-logs-row"));

    expect(mockExportLogs).toHaveBeenCalled();
  });

  it("should open status URL when Ledger Status is pressed", async () => {
    const { user } = render(<MyWalletHelpScreen />);

    await user.press(screen.getByTestId("help-ledger-status-row"));

    expect(Linking.openURL).toHaveBeenCalledWith("https://status.ledger.com");
  });

  it("should open clear cache drawer when Clear cache is pressed", async () => {
    const { user } = render(<MyWalletHelpScreen />);

    await user.press(screen.getByTestId("help-clear-cache-row"));

    expect(screen.getByText("Clear")).toBeVisible();
  });
});
