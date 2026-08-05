import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { render } from "@tests/test-renderer";
import DevToolsScreen from "../screens/DevToolsScreen";

const devToolsSpy = jest.fn();
jest.mock(
  "@devtools/shell",
  () => ({
    DevTools: (props: unknown) => {
      devToolsSpy(props);
      return null;
    },
  }),
  { virtual: true },
);
jest.mock(
  "@devtools/bindings",
  () => ({ useFeatureFlagsToolProps: () => ({ marker: "ff-props" }) }),
  { virtual: true },
);
jest.mock("@devtools/transport-panel", () => ({ TransportPanel: () => null }), { virtual: true });
jest.mock(
  "@devtools/wire",
  () => {
    const wireState = { hubUrl: "ws://127.0.0.1:9090", role: "tool" };
    return {
      buildTransport: () => ({
        transport: {},
        subscribe: () => () => {},
        getState: () => wireState,
        setHubUrl: jest.fn(),
      }),
      buildCopyStoreProtocol: () => ({}),
      combineProtocols: (...args: unknown[]) => args[0],
    };
  },
  { virtual: true },
);

function withBottomInset(children: React.ReactNode) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 0, left: 0, right: 0, bottom: 34 },
      }}
    >
      {children}
    </SafeAreaProvider>
  );
}

describe("DevToolsScreen", () => {
  it("mounts DevTools with the feature-flags tool and stack screen options padded by the bottom inset", () => {
    render(withBottomInset(<DevToolsScreen />));

    expect(devToolsSpy).toHaveBeenCalledTimes(1);
    const props = devToolsSpy.mock.calls[0][0];

    expect(props.config).toEqual([{ id: "feature-flags", config: { marker: "ff-props" } }]);
    expect(props.screenOptions.contentStyle).toEqual([expect.anything(), { paddingBottom: 34 }]);
  });
});
