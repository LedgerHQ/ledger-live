import React from "react";
import { track } from "@shared/analytics";
import { LinkingProvider } from "@shared/linking";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { urls } from "~/utils/urls";
import { MyWalletHelpScreen } from "../screens/Help";

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

const mockExportLogs = jest.fn();
jest.mock("~/components/useExportLogs", () => ({
  __esModule: true,
  default: () => mockExportLogs,
}));

const mockCleanCache = jest.fn(async () => {});
jest.mock("~/actions/general", () => ({
  useCleanCache: () => mockCleanCache,
}));

function renderHelp(overrideInitialState = withFlagOverrides({})) {
  const openExternal = jest.fn();
  const rendered = render(
    <LinkingProvider config={{ openExternal }}>
      <MyWalletHelpScreen />
    </LinkingProvider>,
    { overrideInitialState },
  );
  return { ...rendered, openExternal };
}

describe("My Wallet Help", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the support and learning rows, then the More rows", () => {
    renderHelp();

    expect(screen.getByTestId("my-wallet-help-screen")).toBeVisible();
    for (const text of [
      "Support and learning",
      "Ledger Support",
      "Ledger Academy",
      "More",
      "Save logs",
      "Ledger Status",
      "Clear cache",
    ]) {
      expect(screen.getByText(text)).toBeVisible();
    }
  });

  it("opens the FAQ, Academy and status links", async () => {
    const { user, openExternal } = renderHelp();

    await user.press(screen.getByTestId("settings-help-support"));
    await user.press(screen.getByTestId("settings-help-academy"));
    await user.press(screen.getByTestId("settings-help-status"));

    expect(openExternal.mock.calls).toEqual([
      [urls.faq],
      [urls.resources.ledgerAcademy],
      [urls.resources.status],
    ]);
  });

  it("opens the chatbot from the support row when the chatbot is on", async () => {
    const { user, openExternal } = renderHelp(
      withFlagOverrides({ llmChatbotSupport: { enabled: true } }),
    );

    await user.press(screen.getByText("Ledger Chatbot"));

    expect(openExternal).toHaveBeenCalledWith(urls.chatbot);
  });

  it("saves the logs and tracks the button", async () => {
    const { user } = renderHelp();

    await user.press(screen.getByTestId("settings-help-saveLogs"));

    expect(mockExportLogs).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", { button: "SaveLogs", page: "Help" });
  });

  it("clears the cache once confirmed", async () => {
    const { user } = renderHelp();

    await user.press(screen.getByTestId("settings-help-clearCache"));
    expect(mockCleanCache).not.toHaveBeenCalled();

    await user.press(await screen.findByTestId("settings-help-confirm-button"));

    await waitFor(() => expect(mockCleanCache).toHaveBeenCalledTimes(1));
  });
});
