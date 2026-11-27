import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import { HelpPage } from "./HelpPage";
import { HelpPageWithSlots } from "./HelpPageWithSlots";
import type { HelpSlots } from "./types";
import { createFakeHelpPort, FAKE_HELP_LINKS } from "./__tests__/fakeHelpPort";
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

const WHILE_CONFIRMING = <span data-testid="while-confirming" />;

const SLOTS: HelpSlots = {
  saveLogs: <button type="button">Save logs slot</button>,
  repairDevice: <button type="button">Repair slot</button>,
};

function renderHelpPage(port = createFakeHelpPort(), withSlots = true) {
  const { openExternal, LinkingWrapper } = createFakeLinking();
  render(
    <I18nWrapper>
      <LinkingWrapper>
        {withSlots ? (
          <HelpPageWithSlots
            port={port}
            slots={SLOTS}
            whileConfirming={WHILE_CONFIRMING}
            testID="settings-help"
          />
        ) : (
          <HelpPage port={port} whileConfirming={WHILE_CONFIRMING} testID="settings-help" />
        )}
      </LinkingWrapper>
    </I18nWrapper>,
  );
  return { port, openExternal };
}

describe("HelpPage", () => {
  it("shows the support links, then the More group", () => {
    renderHelpPage();

    const support = screen.getByTestId("settings-help-group-supportAndLearning");
    expect(within(support).getByText("Ledger support")).toBeVisible();
    expect(within(support).getByText("Ledger Academy")).toBeVisible();

    const more = screen.getByTestId("settings-help-group-more");
    for (const title of [
      "Save logs",
      "Ledger status",
      "Clear cache",
      "View user data",
      "Repair your Ledger device",
      "Device setup",
      "Reset Ledger Wallet",
    ]) {
      expect(within(more).getByText(title)).toBeVisible();
    }
  });

  it("opens the support page from the support row", async () => {
    const user = userEvent.setup();
    const { openExternal } = renderHelpPage();

    await user.click(screen.getByTestId("settings-help-support"));

    expect(openExternal.mock.calls).toEqual([[FAKE_HELP_LINKS.support]]);
  });

  it("opens the Academy and status pages from their rows", async () => {
    const user = userEvent.setup();
    const { openExternal } = renderHelpPage();

    await user.click(screen.getByTestId("settings-help-academy"));
    await user.click(screen.getByTestId("settings-help-status"));

    expect(openExternal.mock.calls).toEqual([[FAKE_HELP_LINKS.academy], [FAKE_HELP_LINKS.status]]);
  });

  it("opens the user data from the View button", async () => {
    const user = userEvent.setup();
    const { port } = renderHelpPage();

    await user.click(screen.getByTestId("settings-help-viewUserData-button"));

    expect(port.viewUserData).toHaveBeenCalledTimes(1);
  });

  it("launches the onboarding from its button", async () => {
    const user = userEvent.setup();
    const { port } = renderHelpPage();

    await user.click(screen.getByTestId("settings-help-launchOnboarding-button"));

    expect(port.launchOnboarding).toHaveBeenCalledTimes(1);
  });

  it("renders the app slots in the rows of save logs and repair", () => {
    renderHelpPage(createFakeHelpPort());

    expect(screen.getByRole("button", { name: "Save logs slot" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Repair slot" })).toBeVisible();
  });

  it("leaves the slot rows empty without the slots", () => {
    renderHelpPage(createFakeHelpPort(), false);

    expect(screen.queryByRole("button", { name: "Save logs slot" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Repair slot" })).not.toBeInTheDocument();
  });

  it("asks for a confirmation before clearing the cache", async () => {
    const user = userEvent.setup();
    const { port } = renderHelpPage();

    await user.click(screen.getByTestId("settings-help-clearCache-button"));

    expect(screen.getByTestId("settings-help-confirm-button")).toHaveTextContent("Clear");
    expect(port.clearCache).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("settings-help-confirm-button"));

    expect(port.clearCache).toHaveBeenCalledTimes(1);
  });

  it("does not clear the cache when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const { port } = renderHelpPage();

    await user.click(screen.getByTestId("settings-help-clearCache-button"));
    await user.click(screen.getByTestId("settings-help-cancel-button"));

    expect(port.clearCache).not.toHaveBeenCalled();
  });

  it("asks for a confirmation before resetting, then resets", async () => {
    const user = userEvent.setup();
    const { port } = renderHelpPage();

    await user.click(screen.getByTestId("settings-help-resetApp-button"));

    expect(screen.getByRole("heading", { name: "Reset Ledger Wallet" })).toBeVisible();
    expect(
      screen.getByText(/Resetting Ledger Wallet will erase your swap transaction history/),
    ).toBeVisible();
    expect(port.resetApp).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("settings-help-confirm-button"));

    expect(port.resetApp).toHaveBeenCalledTimes(1);
  });

  it("tracks the Help screen, and no button event until one is pressed", () => {
    renderHelpPage();

    expect(mockTrackScreen.mock.calls.map(([props]) => props)).toEqual([
      { category: "Settings", name: "Help" },
    ]);
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it.each([
    ["clearCache", "ClearCacheIntent"],
    ["viewUserData", "View user data"],
    ["resetApp", "HardResetIntent"],
    ["launchOnboarding", "Launch Onboarding from Settings"],
  ])("tracks %s as %s when its button is pressed", async (id, event) => {
    const user = userEvent.setup();
    renderHelpPage();

    await user.click(screen.getByTestId(`settings-help-${id}-button`));

    expect(mockTrack.mock.calls).toEqual([[event]]);
  });

  it("tracks no event for the rows that had none", async () => {
    const user = userEvent.setup();
    renderHelpPage();

    await user.click(screen.getByTestId("settings-help-support"));

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("tracks the confirmation screen while it is open", async () => {
    const user = userEvent.setup();
    renderHelpPage();

    await user.click(screen.getByTestId("settings-help-resetApp-button"));

    expect(mockTrackScreen).toHaveBeenLastCalledWith(
      { category: "Modal", name: "HardReset" },
      undefined,
    );

    await user.click(screen.getByTestId("settings-help-cancel-button"));
    mockTrackScreen.mockClear();
    await user.click(screen.getByTestId("settings-help-clearCache-button"));

    expect(mockTrackScreen).toHaveBeenLastCalledWith(
      { category: "Modal", name: "CleanCache" },
      undefined,
    );
  });

  it("renders what the app gives for the time of a confirmation", async () => {
    const user = userEvent.setup();
    renderHelpPage();
    expect(screen.queryByTestId("while-confirming")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("settings-help-resetApp-button"));
    expect(screen.getByTestId("while-confirming")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-help-cancel-button"));
    expect(screen.queryByTestId("while-confirming")).not.toBeInTheDocument();
  });
});
