import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { render, withFlagOverrides } from "@tests/test-renderer";
import { EarnWebview } from "../index";

// The webview is native: the test reads the custom handlers the Earn player hands to it.
const mockWebviewProps = jest.fn();
jest.mock("~/components/Web3AppWebview", () => ({
  Web3AppWebview: (props: object) => {
    mockWebviewProps(props);
    return null;
  },
}));

const MANIFEST: LiveAppManifest = {
  id: "earn-test",
  name: "Earn Test",
  url: "https://earn.test",
  homepageUrl: "https://earn.test",
  platforms: ["ios", "android"],
  apiVersion: "2.0.0",
  manifestVersion: "2",
  branch: "stable",
  permissions: [],
  domains: [],
  categories: [],
  currencies: "*",
  visibility: "complete",
  content: {
    shortDescription: { en: "test" },
    description: { en: "test" },
  },
};

const Stack = createNativeStackNavigator();
const EarnTestScreen = () => <EarnWebview manifest={MANIFEST} />;

const STAKE_POSITION_METHOD = "custom.stake.position.open";

function renderEarnWebview(flags: Parameters<typeof withFlagOverrides>[0]) {
  render(
    <Stack.Navigator>
      <Stack.Screen name="EarnTest" component={EarnTestScreen} />
    </Stack.Navigator>,
    { overrideInitialState: withFlagOverrides(flags) },
  );
  return mockWebviewProps.mock.lastCall?.[0].customHandlers as Record<string, unknown>;
}

describe("EarnWebview", () => {
  beforeEach(() => {
    mockWebviewProps.mockClear();
  });

  it("should let the Earn live app open a stake position when the flag is on", () => {
    const customHandlers = renderEarnWebview({ earnNativeStakePosition: { enabled: true } });

    expect(customHandlers).toEqual(
      expect.objectContaining({ [STAKE_POSITION_METHOD]: expect.any(Function) }),
    );
  });

  it.each([
    ["off", { earnNativeStakePosition: { enabled: false } }],
    ["not set", {}],
  ])("should leave the stake position method unknown while the flag is %s", (_state, flags) => {
    const customHandlers = renderEarnWebview(flags);

    expect(Object.keys(customHandlers)).not.toContain(STAKE_POSITION_METHOD);
    expect(Object.keys(customHandlers).length).toBeGreaterThan(0);
  });
});
