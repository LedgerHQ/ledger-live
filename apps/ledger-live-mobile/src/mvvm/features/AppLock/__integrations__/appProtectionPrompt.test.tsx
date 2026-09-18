import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import QueuedBottomSheetsProvider from "LLM/components/QueuedDrawer/QueuedBottomSheetsProvider";
import React, { useState } from "react";
import { Pressable, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName } from "~/const";
import type { State } from "~/reducers/types";
import {
  AppProtectionPromptProvider,
  AppProtectionPromptWrapper,
  useAppProtectionPrompt,
} from "../AppProtectionPrompt";
import { AppLockPasswordAddNavigator } from "../Navigator";

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(3)),
}));

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  getBiometricsAvailability: jest.fn(async () => ({ status: "unavailable" })),
  promptBiometrics: jest.fn(async () => ({ status: "succeeded" })),
  storeBiometricsMarker: jest.fn(async () => true),
  storeNewPassword: jest.fn(async () => undefined),
}));

const { getBiometricsAvailability } = jest.requireMock("@features/platform-app-lock");

const PASSWORD = "longenough";
const ACTION = "caller-action";
const OUTCOME = "caller-outcome";
const CONFIRM = "app-lock-enable-protection-confirm";
const CONTINUE = "app-lock-protection-enabled-continue";
const SHEET_CLOSE = "bottom-sheet-header-close-button";
const LEAVE = "leave-password-flow";
const ELSEWHERE = "go-elsewhere";

const RootStack = createNativeStackNavigator();
const BaseStack = createNativeStackNavigator();

function CallerScreen(): React.JSX.Element {
  const { requestProtection } = useAppProtectionPrompt();
  const navigation = useNavigation();
  const [outcome, setOutcome] = useState("idle");

  return (
    <>
      <Pressable
        testID={ACTION}
        onPress={async () => setOutcome((await requestProtection()) ? "resumed" : "held")}
      />
      <Pressable testID={ELSEWHERE} onPress={() => navigation.navigate("Elsewhere" as never)} />
      <Text testID={OUTCOME}>{outcome}</Text>
    </>
  );
}

function PasswordFlowHost(): React.JSX.Element {
  const navigation = useNavigation();

  return (
    <>
      <Pressable testID={LEAVE} onPress={() => navigation.goBack()} />
      <AppLockPasswordAddNavigator />
    </>
  );
}

function ElsewhereScreen(): React.JSX.Element {
  return <Text testID="elsewhere-screen">elsewhere</Text>;
}

// The real tree registers the password flow inside Base, and mounts this host outside the
// navigators: a bare root-level navigate would not reach the flow, and the test has to be able
// to tell.
function BaseNavigator(): React.JSX.Element {
  return (
    <BaseStack.Navigator screenOptions={{ headerShown: false }}>
      <BaseStack.Screen name="Caller" component={CallerScreen} />
      <BaseStack.Screen name={NavigatorName.PasswordAddFlow} component={PasswordFlowHost} />
      <BaseStack.Screen name="Elsewhere" component={ElsewhereScreen} />
    </BaseStack.Navigator>
  );
}

function Harness(): React.JSX.Element {
  return (
    <QueuedBottomSheetsProvider>
      <AppProtectionPromptProvider>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name={NavigatorName.Base} component={BaseNavigator} />
        </RootStack.Navigator>
        <AppProtectionPromptWrapper />
      </AppProtectionPromptProvider>
    </QueuedBottomSheetsProvider>
  );
}

const unprotected = withFlagOverrides({ lwmPasswordRevamp: { enabled: true } }, (state: State) => ({
  ...state,
  appLock: {
    ...state.appLock,
    isHydrated: true,
    hasPassword: false,
    biometricsEnabled: false,
  },
}));

const alreadyProtected = (state: State) => ({
  ...state,
  appLock: { ...state.appLock, isHydrated: true, hasPassword: true },
});

const unprotectedWithoutRevamp = (state: State) => ({
  ...state,
  appLock: {
    ...state.appLock,
    isHydrated: true,
    hasPassword: false,
    biometricsEnabled: false,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  getBiometricsAvailability.mockResolvedValue({ status: "unavailable" });
});

describe("asking from anywhere for the app to be protected", () => {
  it("lets an already-protected caller straight through, with no sheet", async () => {
    const { user } = render(<Harness />, { overrideInitialState: alreadyProtected });

    await user.press(await screen.findByTestId(ACTION));

    expect(await screen.findByText("resumed")).toBeVisible();
    expect(screen.queryByTestId(CONFIRM)).toBeNull();
  });

  it("offers biometrics when the device has them, and resumes the caller once enabled", async () => {
    getBiometricsAvailability.mockResolvedValue({ status: "available", kind: "FaceID" });

    const { user } = render(<Harness />, { overrideInitialState: unprotected });

    await user.press(await screen.findByTestId(ACTION));

    expect(await screen.findByText(/requires FaceID/)).toBeVisible();

    await user.press(screen.getByTestId(CONFIRM));

    expect(await screen.findByText("FaceID enabled")).toBeVisible();
    expect(screen.getByTestId(OUTCOME)).toHaveTextContent("idle");

    await user.press(screen.getByTestId(CONTINUE));

    expect(await screen.findByText("resumed")).toBeVisible();
  });

  it("asks for a password when the device has no biometrics, and resumes once it is created", async () => {
    const { user, store } = render(<Harness />, { overrideInitialState: unprotected });

    await user.press(await screen.findByTestId(ACTION));

    expect(await screen.findByText("Create a password")).toBeVisible();

    await user.press(screen.getByTestId(CONFIRM));

    const chosen = await screen.findByTestId("app-lock-setup-password-field");
    await user.type(chosen, PASSWORD);
    await user.press(screen.getByTestId("app-lock-setup-password-continue"));

    const confirmed = await screen.findByTestId("app-lock-confirm-password-field");
    await user.type(confirmed, PASSWORD);
    await user.press(screen.getByTestId("app-lock-confirm-password-confirm"));

    await waitFor(() => expect(store.getState().appLock.hasPassword).toBe(true));

    expect(await screen.findByText("Password created")).toBeVisible();

    await user.press(screen.getByTestId(CONTINUE));

    expect(await screen.findByText("resumed")).toBeVisible();
  });

  it("stays open when the caller navigates away, being mounted above the screens", async () => {
    const { user } = render(<Harness />, { overrideInitialState: unprotected });

    await user.press(await screen.findByTestId(ACTION));
    await screen.findByTestId(CONFIRM);

    await user.press(screen.getByTestId(ELSEWHERE));

    expect(await screen.findByTestId("elsewhere-screen")).toBeVisible();
    expect(screen.getByTestId(CONFIRM)).toBeVisible();
  });

  it("lets a caller through where the host installs no prompt at all", async () => {
    const { user } = render(
      <QueuedBottomSheetsProvider>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name={NavigatorName.Base} component={BaseNavigator} />
        </RootStack.Navigator>
      </QueuedBottomSheetsProvider>,
      { overrideInitialState: unprotected },
    );

    await user.press(await screen.findByTestId(ACTION));

    expect(await screen.findByText("resumed")).toBeVisible();
  });

  it("asks nothing, and lets the caller through, where the revamp is off", async () => {
    const { user } = render(<Harness />, { overrideInitialState: unprotectedWithoutRevamp });

    await user.press(await screen.findByTestId(ACTION));

    expect(await screen.findByText("resumed")).toBeVisible();
    expect(screen.queryByTestId(CONFIRM)).toBeNull();
  });

  it("holds the caller's action when the prompt is dismissed", async () => {
    const { user } = render(<Harness />, { overrideInitialState: unprotected });

    await user.press(await screen.findByTestId(ACTION));
    await user.press(await screen.findByTestId(SHEET_CLOSE));

    expect(await screen.findByText("held")).toBeVisible();
  });

  it("holds the caller's action when the password flow is abandoned", async () => {
    const { user } = render(<Harness />, { overrideInitialState: unprotected });

    await user.press(await screen.findByTestId(ACTION));
    await user.press(await screen.findByTestId(CONFIRM));
    await user.press(await screen.findByTestId(LEAVE));

    expect(await screen.findByText("held")).toBeVisible();
    expect(screen.queryByText("Password created")).toBeNull();
  });
});
