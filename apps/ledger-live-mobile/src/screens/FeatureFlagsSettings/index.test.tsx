import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import {
  clearContentAbTestOverrides,
  hasContentAbTestOverrides,
  setContentAbTestCopy,
  setContentAbTestOverride,
} from "@features/platform-content-ab-tests";
import { i18n } from "~/context/Locale";
import DebugFeatureFlags from "./index";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

const Stack = createNativeStackNavigator();

function FeatureFlagsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DebugFeatureFlags" component={DebugFeatureFlags} />
    </Stack.Navigator>
  );
}

const enabled = { enabled: true, copy: { "banner.title": "Remote title" } };

function experiment(id: string, payload: object) {
  return {
    [`feature_copy_${id}`]: {
      asString: () => JSON.stringify(payload),
      getSource: () => "remote" as const,
    },
  };
}

describe("DebugFeatureFlags content A/B tests", () => {
  let emitSpy: jest.SpyInstance;

  beforeEach(() => {
    emitSpy = jest.spyOn(i18n, "emit");
    clearContentAbTestOverrides();
    setContentAbTestCopy({
      ...experiment("upgrade_banner", enabled),
      ...experiment("zeta_banner", { enabled: false, copy: { "banner.title": "Other" } }),
    });
  });

  afterEach(() => {
    emitSpy.mockRestore();
  });

  it("should list experiments and filter them by name", async () => {
    const { user } = render(<FeatureFlagsStack />);

    expect(screen.getByText("upgradeBanner")).toBeVisible();
    expect(screen.getByText("zetaBanner")).toBeVisible();
    expect(screen.getByRole("button", { name: "Restore all flag values" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Search flag"), "upgrade");

    expect(screen.getByText("upgradeBanner")).toBeVisible();
    expect(screen.queryByText("zetaBanner")).toBeNull();
  });

  it("should keep the group visible when the search matches its name", async () => {
    const { user } = render(<FeatureFlagsStack />);

    await user.type(screen.getByPlaceholderText("Search flag"), "content ab");
    await user.press(screen.getByText("Groups"));

    expect(screen.getByText("contentAbTests")).toBeVisible();
    expect(screen.queryByText("upgradeBanner")).toBeNull();
  });

  it("should restore content overrides together with feature flags", async () => {
    setContentAbTestOverride("upgradeBanner", {
      ...enabled,
      copy: { "banner.title": "Local" },
    });
    const { user } = render(<FeatureFlagsStack />);

    const restoreAll = screen.getByRole("button", { name: "Restore all flag values" });
    expect(restoreAll).toBeEnabled();

    await user.press(restoreAll);

    expect(hasContentAbTestOverrides()).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith("languageChanged", expect.any(String));
  });
});
