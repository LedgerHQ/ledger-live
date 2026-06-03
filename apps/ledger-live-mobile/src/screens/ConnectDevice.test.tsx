import React from "react";
import { render, screen } from "@tests/test-renderer";
import ConnectDevice from "./ConnectDevice";
import { ScreenName } from "~/const";

const handleTx = jest.fn();

jest.mock("~/logic/screenTransactionHooks", () => ({
  useSignedTxHandler: () => handleTx,
}));

jest.mock("~/hooks/deviceActions", () => ({
  useTransactionDeviceAction: () => ({}),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({
    account: { type: "Account", currency: { family: "hedera", id: "hedera" } },
    parentAccount: null,
  }),
}));

jest.mock("~/components/DeviceAction/rendering", () => ({
  renderLoading: () => null,
}));

jest.mock("~/analytics", () => ({
  TrackScreen: () => null,
}));

// Simulates the real DeviceAction component: once the device action reaches its
// result state it calls `renderOnResult(payload)` on every render, including the
// internal re-renders caused by subsequent device-action emissions.
jest.mock("~/components/DeviceAction", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  const payload = { signedOperation: { signature: "sig", operation: {} } };
  const MockDeviceAction = ({
    renderOnResult,
  }: {
    renderOnResult?: (p: unknown) => React.ReactNode;
  }) => {
    const [, forceRender] = React.useState(0);
    const ui = renderOnResult ? renderOnResult(payload) : null;
    return React.createElement(
      React.Fragment,
      null,
      ui,
      React.createElement(
        Pressable,
        { testID: "rerender", onPress: () => forceRender((n: number) => n + 1) },
        React.createElement(Text, null, "rerender"),
      ),
    );
  };
  return { __esModule: true, default: MockDeviceAction };
});

const baseRoute = {
  key: "connect",
  name: ScreenName.SendConnectDevice,
  params: {
    appName: "Hedera",
    transaction: { mode: "send", family: "hedera" },
    status: {},
    device: { deviceId: "device-1", modelId: "stax", wired: false },
    analyticsPropertyFlow: "send",
  },
};

const navigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  setOptions: jest.fn(),
};

describe("ConnectDevice broadcast (send flow)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("broadcasts only once even when the device action re-renders in the result state", async () => {
    const { user } = render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <ConnectDevice route={baseRoute as any} navigation={navigation as any} />,
    );

    // The device action re-renders internally after reaching the signed result
    // (e.g. a further connection/state emission). This must not re-broadcast.
    await user.press(screen.getByTestId("rerender"));
    await user.press(screen.getByTestId("rerender"));

    expect(handleTx).toHaveBeenCalledTimes(1);
  });
});
