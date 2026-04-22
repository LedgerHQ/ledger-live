import React from "react";
import { Linking } from "react-native";
import { render, screen, fireEvent } from "@tests/test-renderer";
import { MyWalletHelpScreen } from "../index";
import { urls } from "~/utils/urls";

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

describe("MyWalletHelpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it("should render all sections and rows, and open correct URLs on press", () => {
    render(<MyWalletHelpScreen />);

    expect(screen.getByTestId("my-wallet-help-screen")).toBeVisible();
    expect(screen.getByText(/support and learning/i)).toBeVisible();
    expect(screen.getByText(/more/i)).toBeVisible();
    expect(screen.getByText(/ledger support/i)).toBeVisible();
    expect(screen.getByText(/get help with our faqs or chat/i)).toBeVisible();
    expect(screen.getByText(/ledger academy/i)).toBeVisible();
    expect(screen.getByText(/learn crypto/i)).toBeVisible();

    fireEvent.press(screen.getByTestId("help-ledger-support-row"));
    expect(Linking.openURL).toHaveBeenCalledWith(urls.faq);

    fireEvent.press(screen.getByTestId("help-ledger-academy-row"));
    expect(Linking.openURL).toHaveBeenCalledWith(urls.resources.ledgerAcademy);
  });
});
