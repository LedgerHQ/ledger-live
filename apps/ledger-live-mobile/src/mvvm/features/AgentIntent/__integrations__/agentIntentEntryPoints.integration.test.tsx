import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { track } from "@shared/analytics";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { ManageAgentsButton } from "LLM/features/MyWallet/views/ManageAgentsButton";
import { AgentIntentNavigator, AgentIntentTabNavigator } from "../Navigator";

const Stack = createNativeStackNavigator();

function renderFromMyWallet(profile: boolean, newBadge = false) {
  return render(
    <Stack.Navigator>
      <Stack.Screen name={ScreenName.MyWallet} component={ManageAgentsButton} />
      <Stack.Screen name={NavigatorName.AgentIntent} component={AgentIntentNavigator} />
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides({
        agentIntent: { enabled: true, params: { navBar: false, profile, newBadge } },
      }),
    },
  );
}

describe("Agent Intent entry points", () => {
  afterEach(() => {
    jest.mocked(track).mockClear();
  });

  it("should open Agent Intent from the My Wallet card and track the profile source", async () => {
    const { user } = renderFromMyWallet(true);

    await user.press(screen.getByText("Manage your agents"));

    expect(await screen.findByTestId("agent-intent-placeholder")).toBeVisible();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "agent_intent", source: "profile" }),
    );
  });

  it.each([true, false])(
    "should show the new badge and track it when the flag newBadge is %s",
    async newBadge => {
      const { user } = renderFromMyWallet(true, newBadge);

      expect(screen.queryByTestId("manage-agents-card-new-badge") !== null).toBe(newBadge);

      await user.press(screen.getByText("Manage your agents"));

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({ button: "agent_intent", newBadge }),
      );
    },
  );

  it("should hide the My Wallet card when the profile entry point is off", () => {
    renderFromMyWallet(false);

    expect(screen.queryByText("Manage your agents")).toBeNull();
  });

  it("should render Agent Intent in the Agents tab", async () => {
    render(<AgentIntentTabNavigator />);

    expect(await screen.findByTestId("agent-intent-placeholder")).toBeVisible();
  });
});
