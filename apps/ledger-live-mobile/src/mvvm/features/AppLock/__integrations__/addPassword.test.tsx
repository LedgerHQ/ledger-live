import { PasswordDraftProvider, usePasswordDraft } from "@features/flow-app-lock";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { track } from "@shared/analytics";
import { render, screen, waitFor } from "@tests/test-renderer";
import React from "react";
import { updateIdentify } from "~/analytics";
import type { PasswordAddFlowParamList } from "~/components/RootNavigator/types/PasswordAddFlowNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { AppLockPasswordAddNavigator } from "../Navigator";
import { ConfirmPasswordScreen } from "../screens/ConfirmPassword";
import { SetupPasswordScreen } from "../screens/SetupPassword";
import type { ProtectionSource } from "../types";

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(3)),
}));

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  storeNewPassword: jest.fn(async () => undefined),
}));

const { storeNewPassword } = jest.requireMock("@features/platform-app-lock");

const PASSWORD = "longenough";

const Stack = createNativeStackNavigator<PasswordAddFlowParamList>();

function ChosenPassword({
  password,
  children,
}: Readonly<{ password: string; children: React.ReactNode }>): React.JSX.Element {
  usePasswordDraft().write(password);

  return <>{children}</>;
}

function Screen({
  name,
  component,
}: Readonly<{
  name: ScreenName.PasswordAdd | ScreenName.ConfirmPassword;
  component: React.ComponentType;
}>): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name={name} component={component} initialParams={{ source: "settings" }} />
    </Stack.Navigator>
  );
}

const FlowHost = createNativeStackNavigator<{
  [NavigatorName.PasswordAddFlow]: {
    screen: ScreenName.PasswordAdd;
    params: Readonly<{ source: ProtectionSource }>;
  };
}>();

function AddPasswordFlow({ source }: Readonly<{ source: ProtectionSource }>): React.JSX.Element {
  return (
    <FlowHost.Navigator screenOptions={{ headerShown: false }}>
      <FlowHost.Screen
        name={NavigatorName.PasswordAddFlow}
        component={AppLockPasswordAddNavigator}
        initialParams={{ screen: ScreenName.PasswordAdd, params: { source } }}
      />
    </FlowHost.Navigator>
  );
}

beforeEach(() => jest.clearAllMocks());

describe("choosing a password", () => {
  it("only offers to continue once the minimum is met", async () => {
    const { user } = render(
      <PasswordDraftProvider>
        <Screen name={ScreenName.PasswordAdd} component={SetupPasswordScreen} />
      </PasswordDraftProvider>,
    );

    const field = await screen.findByTestId("app-lock-setup-password-field");
    const cta = screen.getByTestId("app-lock-setup-password-continue");

    expect(cta).toBeDisabled();

    await user.type(field, "short");
    await waitFor(() => expect(cta).toBeDisabled());

    await user.clear(field);
    await user.type(field, PASSWORD);
    await waitFor(() => expect(cta).toBeEnabled());
  });
});

describe("confirming a password", () => {
  const renderConfirm = () =>
    render(
      <PasswordDraftProvider>
        <ChosenPassword password={PASSWORD}>
          <Screen name={ScreenName.ConfirmPassword} component={ConfirmPasswordScreen} />
        </ChosenPassword>
      </PasswordDraftProvider>,
    );

  it("stores a verifier once both entries agree", async () => {
    const { store, user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    await waitFor(() => expect(storeNewPassword).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(store.getState().appLock.hasPassword).toBe(true));
  });

  it("says so in place when the two entries differ", async () => {
    const { user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, "somethingelse");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(await screen.findByText("Passwords don't match")).toBeVisible();
    await waitFor(() => expect(storeNewPassword).not.toHaveBeenCalled());
  });

  it("drops a previous save failure once the user types again", async () => {
    storeNewPassword.mockRejectedValueOnce(new Error("keychain unavailable"));

    const { user } = renderConfirm();

    const field = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(field, PASSWORD);
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(
      await screen.findByText("We couldn't save your password. Please try again."),
    ).toBeVisible();

    await user.clear(field);
    await user.type(field, "somethingelse");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(await screen.findByText("Passwords don't match")).toBeVisible();
  });
});

describe("tracking the activation", () => {
  it.each<ProtectionSource>(["settings", "card"])(
    "reports it once, from %s, without any password material",
    async source => {
      const { user } = render(<AddPasswordFlow source={source} />);

      await user.type(await screen.findByTestId("app-lock-setup-password-field"), PASSWORD);
      await user.press(screen.getByTestId("app-lock-setup-password-continue"));
      await user.type(await screen.findByTestId("app-lock-confirm-password-field"), PASSWORD);
      await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

      await waitFor(() =>
        expect(track).toHaveBeenCalledWith("encryption_activated", { type: "password", source }),
      );
      expect(track).toHaveBeenCalledTimes(1);
      expect(updateIdentify).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(jest.mocked(track).mock.calls)).not.toContain(PASSWORD);
    },
  );

  it("reports nothing when the entries differ", async () => {
    const { user } = render(<AddPasswordFlow source="settings" />);

    await user.type(await screen.findByTestId("app-lock-setup-password-field"), PASSWORD);
    await user.press(screen.getByTestId("app-lock-setup-password-continue"));
    await user.type(await screen.findByTestId("app-lock-confirm-password-field"), "somethingelse");
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(await screen.findByText("Passwords don't match")).toBeVisible();
    expect(track).not.toHaveBeenCalled();
  });

  it("reports nothing when the password cannot be saved", async () => {
    storeNewPassword.mockRejectedValueOnce(new Error("keychain unavailable"));
    const { user } = render(<AddPasswordFlow source="card" />);

    await user.type(await screen.findByTestId("app-lock-setup-password-field"), PASSWORD);
    await user.press(screen.getByTestId("app-lock-setup-password-continue"));
    await user.type(await screen.findByTestId("app-lock-confirm-password-field"), PASSWORD);
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    expect(
      await screen.findByText("We couldn't save your password. Please try again."),
    ).toBeVisible();
    expect(track).not.toHaveBeenCalled();
  });
});
