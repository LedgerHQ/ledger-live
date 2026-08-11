import React from "react";
import { render, screen } from "tests/testSetup";
import DevToolsScreen from "../screens/DevToolsScreen";

const mockNavigate = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));
jest.mock("@devtools/transport-panel", () => ({
  TransportPanel: () => null,
}));

const devToolsSpy = jest.fn();
jest.mock("@devtools/shell", () => ({
  DevTools: (props: { config: unknown; onClose: () => void }) => {
    devToolsSpy(props);
    return (
      <button type="button" onClick={props.onClose}>
        close-devtools
      </button>
    );
  },
}));

jest.mock("@devtools/bindings", () => ({
  useFeatureFlagsToolProps: () => ({ marker: "ff-props" }),
}));

jest.mock("@devtools/wire", () => {
  const wireState = { hubUrl: "ws://127.0.0.1:9090", role: "host" };
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
});

describe("DevToolsScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    devToolsSpy.mockClear();
  });

  it("mounts the DevTools shell with the feature-flags tool config", () => {
    render(<DevToolsScreen />);

    expect(devToolsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        config: [{ id: "feature-flags", config: { marker: "ff-props" } }],
      }),
    );
  });

  it("navigates back when DevTools requests close", async () => {
    const { user } = render(<DevToolsScreen />);

    await user.click(screen.getByText("close-devtools"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
