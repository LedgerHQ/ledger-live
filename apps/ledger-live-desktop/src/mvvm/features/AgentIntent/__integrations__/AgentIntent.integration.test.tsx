import React from "react";
import { Route, Routes } from "react-router";
import * as analytics from "@shared/analytics";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import ContextMenuContext from "LLD/features/MyWallet/components/ContextMenuContext";
import { CONTEXT_MENU_VIEW } from "LLD/features/MyWallet/components/ContextMenu/types";
import { ManageAgentsButton } from "LLD/features/MyWallet/components/ManageAgentsButton";
import { AgentIntentPlaceholderScreen } from "LLD/features/AgentIntent";

const mockClose = jest.fn();

const contextMenuValue = {
  close: mockClose,
  view: CONTEXT_MENU_VIEW.myWallet,
  direction: "forward" as const,
  navigateTo: jest.fn(),
  goBack: jest.fn(),
};

function withAgentIntent(navBar: boolean, profile: boolean, newBadge = false) {
  return withFlagOverrides({
    agentIntent: { enabled: true, params: { navBar, profile, newBadge } },
  });
}

function renderApp(initialState: ReturnType<typeof withFlagOverrides>, initialRoute = "/") {
  return render(
    <ContextMenuContext.Provider value={contextMenuValue}>
      <Routes>
        <Route path="/" element={<ManageAgentsButton />} />
        <Route path="/agent-intent" element={<AgentIntentPlaceholderScreen />} />
      </Routes>
    </ContextMenuContext.Provider>,
    { initialState, initialRoute },
  );
}

describe("Agent Intent entry points", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open Agent Intent from the My Wallet card and track the profile source", async () => {
    const trackSpy = jest.spyOn(analytics, "track");
    const { user } = renderApp(withAgentIntent(false, true));

    await user.click(screen.getByText("Manage your agents"));

    expect(await screen.findByTestId("agent-intent-placeholder")).toBeVisible();
    expect(trackSpy).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "agent_intent", source: "profile" }),
    );
    expect(mockClose).toHaveBeenCalled();
    trackSpy.mockRestore();
  });

  it.each([true, false])(
    "should show the new badge and track it when the flag newBadge is %s",
    async newBadge => {
      const trackSpy = jest.spyOn(analytics, "track");
      const { user } = renderApp(withAgentIntent(false, true, newBadge));

      expect(screen.queryByTestId("manage-agents-card-new-badge") !== null).toBe(newBadge);

      await user.click(screen.getByText("Manage your agents"));

      expect(trackSpy).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({ button: "agent_intent", newBadge }),
      );
      trackSpy.mockRestore();
    },
  );

  it("should hide the My Wallet card when the profile entry point is off", () => {
    renderApp(withAgentIntent(true, false));

    expect(screen.queryByText("Manage your agents")).not.toBeInTheDocument();
  });

  it("should show Agent Intent opened from the nav bar", () => {
    renderApp(withAgentIntent(true, false), "/agent-intent?source=nav_bar");

    expect(screen.getByTestId("agent-intent-placeholder")).toBeVisible();
  });

  it("should send back home when every entry point is off", () => {
    renderApp(withAgentIntent(false, false), "/agent-intent?source=nav_bar");

    expect(screen.queryByTestId("agent-intent-placeholder")).not.toBeInTheDocument();
  });
});
