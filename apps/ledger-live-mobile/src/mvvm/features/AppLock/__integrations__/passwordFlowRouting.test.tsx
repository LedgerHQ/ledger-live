import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import React from "react";
import PasswordAddFlowNavigator from "~/components/RootNavigator/PasswordAddFlowNavigator";
import PasswordModifyFlowNavigator from "~/components/RootNavigator/PasswordModifyFlowNavigator";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";

const Host = createNativeStackNavigator();

function AddFlow(): React.JSX.Element {
  return (
    <Host.Navigator screenOptions={{ headerShown: false }}>
      <Host.Screen
        name={NavigatorName.PasswordAddFlow}
        component={PasswordAddFlowNavigator}
        initialParams={{ screen: ScreenName.PasswordAdd, params: { source: "settings" } }}
      />
    </Host.Navigator>
  );
}

// The flag stays off throughout: these cases are about the scheme outranking it.
const stored = (hasPassword: boolean) => (state: State) => ({
  ...state,
  appLock: { ...state.appLock, isHydrated: true, hasPassword },
});

describe("routing the password flows", () => {
  it("sends a stored verifier to the revamped removal even with the flag off", async () => {
    render(<PasswordModifyFlowNavigator />, { overrideInitialState: stored(true) });

    expect(await screen.findByTestId("app-lock-deactivate-password-field")).toBeVisible();
  });

  it("leaves a legacy user on the legacy removal", async () => {
    render(<PasswordModifyFlowNavigator />, { overrideInitialState: stored(false) });

    expect(await screen.findByPlaceholderText("Confirm your password")).toBeVisible();
  });

  it("sends a stored verifier to the revamped setup even with the flag off", async () => {
    render(<AddFlow />, { overrideInitialState: stored(true) });

    expect(await screen.findByTestId("app-lock-setup-password-field")).toBeVisible();
  });

  it("leaves a legacy user on the legacy setup", async () => {
    render(<AddFlow />, { overrideInitialState: stored(false) });

    expect(await screen.findByPlaceholderText("Choose your password")).toBeVisible();
  });
});
