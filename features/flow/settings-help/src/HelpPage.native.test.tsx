import React from "react";
import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import { HelpPage } from "./HelpPage";
import { createFakeMobileHelpPort, FAKE_HELP_LINKS } from "./__tests__/fakeHelpPort";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { I18nWrapper } from "./__tests__/i18nWrapper";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ TrackScreen: jest.fn(() => null) }));

const mockTrack = jest.mocked(track);
const mockTrackScreen = jest.mocked(TrackScreen);

beforeEach(() => {
  mockTrack.mockClear();
  mockTrackScreen.mockClear();
});

function renderHelpPage(port = createFakeMobileHelpPort()) {
  const { openExternal, LinkingWrapper } = createFakeLinking();
  render(
    <I18nWrapper>
      <LinkingWrapper>
        <HelpPage port={port} testID="my-wallet-help-screen" />
      </LinkingWrapper>
    </I18nWrapper>,
  );
  return { port, openExternal, user: userEvent.setup() };
}

describe("HelpPage on mobile", () => {
  it("shows the five My Wallet Help rows, without the desktop rows", () => {
    renderHelpPage();

    expect(screen.getByTestId("my-wallet-help-screen")).toBeVisible();
    for (const title of [
      "Ledger Support",
      "Ledger Academy",
      "Save logs",
      "Ledger Status",
      "Clear cache",
    ]) {
      expect(screen.getByText(title)).toBeVisible();
    }
    expect(screen.queryByText("View user data")).toBeNull();
    expect(screen.queryByText("Reset Ledger Wallet")).toBeNull();
    expect(screen.queryByText("Device setup")).toBeNull();
  });

  it("names the support row after the chatbot when it opens it", () => {
    renderHelpPage(createFakeMobileHelpPort({ supportOpensChatbot: true }));

    expect(screen.getByText("Ledger Chatbot")).toBeVisible();
    expect(screen.queryByText("Ledger Support")).toBeNull();
  });

  it("opens the support, Academy and status links", async () => {
    const { user, openExternal } = renderHelpPage();

    await user.press(screen.getByTestId("settings-help-support"));
    await user.press(screen.getByTestId("settings-help-academy"));
    await user.press(screen.getByTestId("settings-help-status"));

    expect(openExternal.mock.calls).toEqual([
      [FAKE_HELP_LINKS.support],
      [FAKE_HELP_LINKS.academy],
      [FAKE_HELP_LINKS.status],
    ]);
  });

  it("saves the logs through the port", async () => {
    const { user, port } = renderHelpPage();

    await user.press(screen.getByTestId("settings-help-saveLogs"));

    expect(port.saveLogs).toHaveBeenCalledTimes(1);
  });

  it("clears the cache once confirmed", async () => {
    const { user, port } = renderHelpPage();

    await user.press(screen.getByTestId("settings-help-clearCache"));
    expect(port.clearCache).not.toHaveBeenCalled();
    expect(
      screen.getByText("A fresh and complete scan of transactions on the network will be done."),
    ).toBeVisible();

    await user.press(screen.getByTestId("settings-help-confirm-button"));

    await waitFor(() => expect(port.clearCache).toHaveBeenCalledTimes(1));
  });

  it("tracks the My Wallet Help screen and its buttons", async () => {
    const { user } = renderHelpPage();

    expect(mockTrackScreen).toHaveBeenCalledWith(
      { category: "My Wallet", name: "Help" },
      undefined,
    );

    await user.press(screen.getByTestId("settings-help-saveLogs"));
    await user.press(screen.getByTestId("settings-help-clearCache"));

    expect(mockTrack.mock.calls).toEqual([
      ["button_clicked", { button: "SaveLogs", page: "Help" }],
      ["button_clicked", { button: "ClearCache", page: "Help" }],
    ]);
  });
});
