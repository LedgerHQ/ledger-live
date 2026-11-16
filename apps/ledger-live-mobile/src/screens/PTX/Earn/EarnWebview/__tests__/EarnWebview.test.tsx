import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { render } from "@tests/test-renderer";
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

describe("EarnWebview", () => {
  it("should let the Earn live app open a stake position", () => {
    render(
      <Stack.Navigator>
        <Stack.Screen name="EarnTest" component={EarnTestScreen} />
      </Stack.Navigator>,
    );

    expect(mockWebviewProps.mock.lastCall?.[0].customHandlers).toEqual(
      expect.objectContaining({ "custom.stake.position.open": expect.any(Function) }),
    );
  });
});
