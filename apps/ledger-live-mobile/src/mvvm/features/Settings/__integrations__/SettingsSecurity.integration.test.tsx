import React from "react";
import { setHasPassword } from "@features/platform-app-lock";
import { track } from "@shared/analytics";
import { LinkingProvider } from "@shared/linking";
import { act, fireEvent, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import SettingsNavigator from "~/components/RootNavigator/SettingsNavigator";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  getBiometricsAvailability: jest.fn(),
  promptBiometrics: jest.fn(async () => ({ status: "succeeded" })),
  clearBiometricsMarker: jest.fn(async () => true),
}));

jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  getCardSessionToken: jest.fn(),
}));

const mockNavigate = jest.fn();

// The password flows are not part of the Settings navigator: their navigation is recorded, while
// the navigation inside Settings (home to section) stays real.
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  const { NavigatorName: Navigators } = jest.requireActual("~/const");
  const passwordFlows = new Set<string>([
    Navigators.PasswordAddFlow,
    Navigators.PasswordModifyFlow,
  ]);

  return {
    ...actual,
    useNavigation: () => {
      const navigation = actual.useNavigation();
      return {
        ...navigation,
        navigate: (name: string, ...args: unknown[]) =>
          passwordFlows.has(name)
            ? mockNavigate(name, ...args)
            : navigation.navigate(name, ...args),
      };
    },
  };
});

const { getBiometricsAvailability } = jest.requireMock("@features/platform-app-lock");
const { getCardSessionToken } = jest.requireMock("@features/platform-card");

const PASSWORD_TOGGLE = "setting-appLock-toggle";
const BIOMETRICS_TOGGLE = "setting-biometrics-toggle";
const HIDE_BALANCE_TOGGLE = "setting-hideBalance-toggle";
const MEV_TOGGLE = "setting-mevProtection-toggle";
const REFUSAL = "app-lock-keep-protection-dismiss";

type Privacy = NonNullable<State["settings"]["privacy"]>;

const revamped = (protection: Partial<State["appLock"]> = {}) =>
  withFlagOverrides(
    { newSettings: { enabled: true }, lwmPasswordRevamp: { enabled: true } },
    (state: State) => ({
      ...state,
      appLock: { ...state.appLock, isHydrated: true, hasPassword: false, ...protection },
    }),
  );

const legacy = (privacy: Partial<Privacy> = {}) =>
  withFlagOverrides(
    { newSettings: { enabled: true }, lwmPasswordRevamp: { enabled: false } },
    (state: State) => ({
      ...state,
      appLock: { ...state.appLock, isHydrated: true, hasPassword: false },
      settings: {
        ...state.settings,
        privacy: {
          hasPassword: false,
          biometricsType: "FaceID",
          biometricsEnabled: false,
          ...privacy,
        } as Privacy,
      },
    }),
  );

async function openSecurity(overrideInitialState: (state: State) => State) {
  const openExternal = jest.fn();
  const rendered = render(
    <LinkingProvider config={{ openExternal }}>
      <SettingsNavigator />
    </LinkingProvider>,
    { overrideInitialState },
  );

  await rendered.user.press(await screen.findByTestId("settings-home-security"));
  expect(await screen.findByTestId("settings-security")).toBeVisible();

  return { ...rendered, openExternal };
}

// The Lumen switch changes value rather than being pressed.
const turn = async (testID: string, value: boolean) => {
  const toggle = await screen.findByTestId(testID);

  await act(async () => {
    fireEvent(toggle, "checkedChange", value);
  });
};

const tracked = (event: string, payload: Record<string, unknown>) =>
  jest.mocked(track).mock.calls.some(([name, data]) => {
    const props: Record<string, unknown> = { ...data };
    return name === event && Object.entries(payload).every(([key, value]) => props[key] === value);
  });

beforeEach(() => {
  jest.clearAllMocks();
  getBiometricsAvailability.mockResolvedValue({ status: "available", kind: "FaceID" });
  getCardSessionToken.mockResolvedValue(null);
});

describe("Settings Security section", () => {
  describe("rows", () => {
    it("shows hide balance, App lock, biometrics and MEV protection with its link", async () => {
      await openSecurity(revamped());

      expect(await screen.findByText("Hide balance")).toBeVisible();
      expect(screen.getByText("App lock")).toBeVisible();
      expect(await screen.findByText("Face ID")).toBeVisible();
      expect(screen.getByText("MEV protection")).toBeVisible();
      expect(screen.getByText("Learn more")).toBeVisible();
      expect(screen.queryByText("Auto-lock")).toBeNull();
      expect(screen.queryByText("Change password")).toBeNull();
    });

    it("opens the MEV protection page from its link", async () => {
      const { user, openExternal } = await openSecurity(revamped());

      await user.press(await screen.findByText("Learn more"));

      expect(openExternal).toHaveBeenCalledWith(expect.stringContaining("support.ledger.com"));
    });
  });

  describe("hide balance and MEV protection", () => {
    it("stores hide balance in the legacy store and tracks it", async () => {
      const { store } = await openSecurity(revamped());

      await turn(HIDE_BALANCE_TOGGLE, true);

      expect(store.getState().settings.discreetMode).toBe(true);
      expect(tracked("button_clicked", { button: "Discreet mode", toggle: "ON" })).toBe(true);
    });

    it("stores MEV protection in the legacy store and tracks it", async () => {
      const { store } = await openSecurity(revamped());
      const initial = store.getState().settings.mevProtection;

      await turn(MEV_TOGGLE, !initial);

      expect(store.getState().settings.mevProtection).toBe(!initial);
      expect(
        tracked("toggle_clicked", {
          toggle: "MEV",
          toggleAction: initial ? "OFF" : "ON",
        }),
      ).toBe(true);
    });
  });

  describe("App lock, new password flow", () => {
    it("opens the add flow from the source Settings when no password is set", async () => {
      await openSecurity(revamped({ hasPassword: false }));

      await turn(PASSWORD_TOGGLE, true);

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.PasswordAddFlow, {
        screen: ScreenName.PasswordAdd,
        params: { source: "settings" },
      });
      expect(tracked("button_clicked", { button: "enable", type: "password" })).toBe(true);
    });

    it("opens the modify flow to remove a password", async () => {
      await openSecurity(revamped({ hasPassword: true }));

      await turn(PASSWORD_TOGGLE, false);

      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.PasswordModifyFlow),
      );
      expect(tracked("button_clicked", { button: "disable", type: "password" })).toBe(true);
    });

    it("offers biometrics with no password behind it", async () => {
      await openSecurity(revamped({ hasPassword: false }));

      expect(await screen.findByTestId(BIOMETRICS_TOGGLE)).toBeEnabled();
    });

    it("keeps the revamped rows for biometrics alone, whichever the flag says", async () => {
      await openSecurity(
        withFlagOverrides(
          { newSettings: { enabled: true }, lwmPasswordRevamp: { enabled: false } },
          (state: State) => ({
            ...state,
            appLock: {
              ...state.appLock,
              isHydrated: true,
              hasPassword: false,
              biometricsEnabled: true,
            },
          }),
        ),
      );

      expect(await screen.findByTestId(BIOMETRICS_TOGGLE)).toBeChecked();
    });

    it.each([
      ["unavailable", { status: "unavailable" }],
      ["notEnrolled", { status: "notEnrolled" }],
    ])("hides biometrics when the device reports %s", async (_name, availability) => {
      getBiometricsAvailability.mockResolvedValue(availability);

      await openSecurity(revamped());

      expect(await screen.findByTestId(PASSWORD_TOGGLE)).toBeVisible();
      await waitFor(() => expect(screen.queryByTestId(BIOMETRICS_TOGGLE)).toBeNull());
    });

    it("keeps App lock usable when the availability read rejects", async () => {
      getBiometricsAvailability.mockRejectedValue(new Error("keychain unavailable"));

      await openSecurity(revamped());

      expect(await screen.findByTestId(PASSWORD_TOGGLE)).toBeVisible();
      await waitFor(() => expect(screen.queryByTestId(BIOMETRICS_TOGGLE)).toBeNull());
    });

    it("refuses to remove the password that alone protects a card holder", async () => {
      getCardSessionToken.mockResolvedValue("an-access-token");
      await openSecurity(revamped({ hasPassword: true, biometricsEnabled: false }));

      await turn(PASSWORD_TOGGLE, false);

      expect(await screen.findByText("You can't turn off your password")).toBeVisible();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByTestId(REFUSAL)).toBeVisible();
    });

    it("follows a password stored elsewhere in the app", async () => {
      const { store } = await openSecurity(revamped({ hasPassword: false }));
      expect(await screen.findByTestId(PASSWORD_TOGGLE)).not.toBeChecked();

      act(() => {
        store.dispatch(setHasPassword(true));
      });

      await waitFor(() => expect(screen.getByTestId(PASSWORD_TOGGLE)).toBeChecked());
    });
  });

  describe("App lock, legacy password flow", () => {
    it("opens the legacy add flow and tracks the press like the legacy row", async () => {
      await openSecurity(legacy({ hasPassword: false }));

      await turn(PASSWORD_TOGGLE, true);

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.PasswordAddFlow);
      expect(
        tracked("toggle_clicked", {
          toggle: "Password Lock",
          page: ScreenName.GeneralSettings,
          enabled: true,
        }),
      ).toBe(true);
    });

    it("opens the legacy modify flow to remove a password", async () => {
      await openSecurity(legacy({ hasPassword: true }));

      await turn(PASSWORD_TOGGLE, false);

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.PasswordModifyFlow);
    });

    it("waits for a password before offering biometrics", async () => {
      await openSecurity(legacy({ hasPassword: false }));

      expect(await screen.findByTestId(BIOMETRICS_TOGGLE)).toBeDisabled();
      expect(screen.getByText('To enable Face ID, turn on "App lock".')).toBeVisible();
    });

    it("offers biometrics once a password is set", async () => {
      await openSecurity(legacy({ hasPassword: true }));

      expect(await screen.findByTestId(BIOMETRICS_TOGGLE)).toBeEnabled();
      expect(screen.getByText("Use Face ID to open the app.")).toBeVisible();
    });

    it("tracks the biometrics press like the legacy row", async () => {
      await openSecurity(legacy({ hasPassword: true }));

      await turn(BIOMETRICS_TOGGLE, true);

      expect(
        tracked("toggle_clicked", {
          toggle: "biometrics",
          page: ScreenName.GeneralSettings,
          enabled: false,
        }),
      ).toBe(true);
    });

    it("has no biometrics row on a device without biometrics", async () => {
      await openSecurity(legacy({ biometricsType: null }));

      expect(await screen.findByTestId(PASSWORD_TOGGLE)).toBeVisible();
      expect(screen.queryByTestId(BIOMETRICS_TOGGLE)).toBeNull();
    });
  });
});
