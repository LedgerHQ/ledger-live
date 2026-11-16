import React from "react";
import { Alert, Linking } from "react-native";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { readClipboard, copyToClipboard } from "@shared/clipboard";
import type { MockServerDevice } from "@features/platform-device-mock-server";
import type { MockServerSessionChange } from "../../mockServerSession";
import { mockServerOverlaySlice, setMockServerOverlayMode } from "../../state/slice";
import { MockServerOverlay } from "./MockServerOverlay";
import type { MockServerOverlayProps } from "./types";

type GestureHandlers = {
  onStartShouldSetPanResponderCapture?: () => boolean;
  onStartShouldSetPanResponder?: () => boolean;
  onMoveShouldSetPanResponder?: (event: unknown, gesture: { dx: number; dy: number }) => boolean;
  onPanResponderTerminationRequest?: () => boolean;
  onPanResponderGrant?: () => void;
  onPanResponderMove?: (event: unknown, gesture: { dx: number; dy: number }) => void;
  onPanResponderRelease?: () => void;
  onPanResponderTerminate?: () => void;
};

// The preset's react-native stub has no Animated, PanResponder nor window size: these stand-ins
// keep the values the floating bar reads, and hand each gesture callback to the host element.
jest.mock("react-native", () => {
  class AnimatedValue {
    constructor(public value: number) {}
    interpolate = () => this;
  }
  class AnimatedValueXY {
    x: AnimatedValue;
    y: AnimatedValue;
    constructor({ x, y }: { x: number; y: number }) {
      this.x = new AnimatedValue(x);
      this.y = new AnimatedValue(y);
    }
    setValue({ x, y }: { x: number; y: number }) {
      this.x.value = x;
      this.y.value = y;
    }
    stopAnimation(callback: (value: { x: number; y: number }) => void) {
      callback({ x: this.x.value, y: this.y.value });
    }
    extractOffset() {}
    flattenOffset() {}
  }
  return {
    ...jest.requireActual("react-native"),
    Alert: { alert: jest.fn() },
    Animated: {
      View: "Animated.View",
      ValueXY: AnimatedValueXY,
      add: () => new AnimatedValue(0),
      event: () => () => {},
    },
    PanResponder: {
      create: (handlers: GestureHandlers) => ({
        panHandlers: {
          onStartShouldSetResponderCapture: handlers.onStartShouldSetPanResponderCapture,
          onStartShouldSetResponder: handlers.onStartShouldSetPanResponder,
          onMoveShouldSetResponder: (gesture: { dx: number; dy: number }) =>
            handlers.onMoveShouldSetPanResponder?.({}, gesture),
          onResponderTerminationRequest: handlers.onPanResponderTerminationRequest,
          onResponderGrant: handlers.onPanResponderGrant,
          onResponderMove: (gesture: { dx: number; dy: number }) =>
            handlers.onPanResponderMove?.({}, gesture),
          onResponderRelease: handlers.onPanResponderRelease,
          onResponderTerminate: handlers.onPanResponderTerminate,
        },
      }),
    },
    useWindowDimensions: () => ({ width: 400, height: 800 }),
  };
});

jest.mock("react-native-screens", () => ({ FullWindowOverlay: "FullWindowOverlay" }));
jest.mock("react-native-webview", () => ({ __esModule: true, default: "WebView" }));
jest.mock("@ledgerhq/device-mockserver-react-native", () => ({
  MockServerDevice: "MockServerDevice",
}));
jest.mock("@shared/clipboard", () => ({ copyToClipboard: jest.fn(), readClipboard: jest.fn() }));

const SERVER_URL = "https://mock-server.test";
const stax = { id: "device-1", name: "Mock Stax", device_type: "stax", connectivity_type: "USB" };
const flex = { id: "device-2", name: "Mock Flex", device_type: "flex", connectivity_type: "BLE" };
const unknownModel = {
  id: "device-3",
  name: "Mock Unknown",
  device_type: "unknown",
  connectivity_type: "USB",
};

const endpoints = {
  health: jest.fn<Response, []>(),
  session: jest.fn<Response, []>(),
  devices: jest.fn<Response, []>(),
  auth: jest.fn<Response, []>(),
  import: jest.fn<Response, []>(),
};

const server = setupServer(
  http.get(`${SERVER_URL}/health`, () => endpoints.health()),
  http.get(`${SERVER_URL}/sessions/current`, () => endpoints.session()),
  http.get(`${SERVER_URL}/devices`, () => endpoints.devices()),
  http.post(`${SERVER_URL}/auth`, () => endpoints.auth()),
  http.post(`${SERVER_URL}/import`, () => endpoints.import()),
);

const renderOverlay = (props: Partial<MockServerOverlayProps> = {}) => {
  const onApply = jest.fn<Promise<void>, [MockServerSessionChange]>().mockResolvedValue(undefined);
  const onOpenSettings = jest.fn();
  const onSaveKnownDevices = jest.fn<void, [readonly MockServerDevice[]]>();
  const store = configureStore({
    reducer: { mockServerOverlay: mockServerOverlaySlice.reducer },
  });
  render(
    <Provider store={store}>
      <MockServerOverlay
        settings={{ enabled: true, url: SERVER_URL, token: "token-1" }}
        sessionImport={{ devices: [] }}
        colorScheme="light"
        zIndex={10}
        onApply={onApply}
        onOpenSettings={onOpenSettings}
        onSaveKnownDevices={onSaveKnownDevices}
        {...props}
      />
    </Provider>,
  );
  return { onApply, onOpenSettings, onSaveKnownDevices, store };
};

type HostElement = ReturnType<typeof screen.getByTestId>;

/** The closest host ancestor with this prop, skipping the composite components in between. */
const findAncestorWithProp = (element: HostElement, prop: string) => {
  let current = element.parent;
  while (current && !(typeof current.type === "string" && prop in current.props)) {
    current = current.parent;
  }
  if (!current) throw new Error(`No ancestor with ${prop}`);
  return current;
};

const openPanel = async () => {
  fireEvent.press(await screen.findByTestId("mock-server-floating-button"));
  return screen.getByTestId("mock-server-panel");
};

describe("MockServerOverlay", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  beforeEach(() => {
    jest.clearAllMocks();
    endpoints.health.mockImplementation(() => HttpResponse.json({ status: "ok", sessions: 0 }));
    endpoints.session.mockImplementation(() =>
      HttpResponse.json({ id: "session-1", created_at: 0, expires_at: 0, devices: [stax] }),
    );
    endpoints.devices.mockImplementation(() => HttpResponse.json([stax, flex, unknownModel]));
    endpoints.auth.mockImplementation(() => HttpResponse.json({ token: "token-2", expires_at: 0 }));
    endpoints.import.mockImplementation(() => HttpResponse.json({ devices: [] }));
  });

  it("should render nothing when the mock server is off", () => {
    renderOverlay({ settings: { enabled: false, url: "", token: "" } });

    expect(screen.toJSON()).toBeNull();
  });

  it("should show a button per mock device of a known model", async () => {
    renderOverlay();

    expect(await screen.findByTestId("mock-server-device-button-1")).toBeTruthy();
    expect(screen.getByTestId("mock-server-device-button-2")).toBeTruthy();
    expect(screen.queryByTestId("mock-server-device-button-3")).toBeNull();
    expect(screen.getByLabelText("Show Mock Flex")).toBeTruthy();
  });

  it("should hide the floating bar when asked until restart", async () => {
    const { store } = renderOverlay();
    expect(await screen.findByTestId("mock-server-floating-button")).toBeTruthy();

    act(() => {
      store.dispatch(mockServerOverlaySlice.actions.setMockServerFloatingButtonHidden(true));
    });

    expect(screen.queryByTestId("mock-server-floating-button")).toBeNull();
  });

  it("should toggle the panel with the main button", async () => {
    renderOverlay();

    expect(await openPanel()).toBeTruthy();
    expect(await screen.findByTestId("mock-server-webview")).toHaveProp("source", {
      uri: `${SERVER_URL}/#token=token-1`,
    });

    fireEvent.press(screen.getByTestId("mock-server-floating-button"));

    expect(
      screen.getByTestId("mock-server-panel", { includeHiddenElements: true }),
    ).not.toBeVisible();
  });

  it("should close the panel with its close button", async () => {
    const { store } = renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByLabelText("Close mock server panel"));

    expect(store.getState().mockServerOverlay.mode).toEqual({ type: "hidden" });
  });

  it("should close the panel and open the settings", async () => {
    const { onOpenSettings, store } = renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByLabelText("Open the mock server settings"));

    expect(onOpenSettings).toHaveBeenCalled();
    expect(store.getState().mockServerOverlay.mode).toEqual({ type: "hidden" });
  });

  it("should open the session's configuration UI in the browser", async () => {
    renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByLabelText("Open the mock server configuration in the browser"));

    expect(Linking.openURL).toHaveBeenCalledWith(`${SERVER_URL}/#token=token-1`);
  });

  it("should show the error when the browser cannot open", async () => {
    jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error("No browser"));
    renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByLabelText("Open the mock server configuration in the browser"));

    expect(await screen.findByText("No browser")).toBeTruthy();
  });

  it("should copy the session token", async () => {
    renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByText("Copy token"));

    expect(copyToClipboard).toHaveBeenCalledWith("token-1");
  });

  it("should join the pasted session once confirmed", async () => {
    jest.mocked(readClipboard).mockResolvedValue(" shared-token ");
    jest.mocked(Alert.alert).mockImplementation((_title, _message, buttons) => {
      buttons?.find(button => button.text === "Join")?.onPress?.();
    });
    const { onApply } = renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByText("Paste token"));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        settings: { enabled: true, url: SERVER_URL, token: "shared-token" },
        sessionDeviceIds: new Set(["device-1"]),
      }),
    );
    expect(Alert.alert).toHaveBeenCalledWith(
      "Join this session?",
      "Token shared-token\n\nThe app will restart.",
      expect.any(Array),
    );
  });

  it("should report an empty clipboard instead of joining", async () => {
    jest.mocked(readClipboard).mockResolvedValue("  ");
    const { onApply } = renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByText("Paste token"));

    expect(await screen.findByText("The clipboard has no session token.")).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("should start a new session on the current server", async () => {
    const { onApply } = renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByText("New session"));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        settings: { enabled: true, url: SERVER_URL, token: "token-2" },
        sessionDeviceIds: new Set(["device-1"]),
      }),
    );
  });

  it("should show the error when the new session fails", async () => {
    endpoints.auth.mockImplementation(() => HttpResponse.json({}, { status: 500 }));
    const { onApply } = renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByText("New session"));

    expect(await screen.findByText("Mock server error")).toBeTruthy();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("should save the session's devices to the known devices", async () => {
    const { onSaveKnownDevices } = renderOverlay();
    await openPanel();

    fireEvent.press(screen.getByText("Save mocked devices to known devices"));

    await waitFor(() =>
      expect(onSaveKnownDevices).toHaveBeenCalledWith([stax, flex, unknownModel]),
    );
  });

  it("should warn when the session has expired", async () => {
    endpoints.session.mockImplementation(() => HttpResponse.json({}, { status: 401 }));
    renderOverlay();
    await openPanel();

    expect(
      await screen.findByText("Start a new session to keep using the mock server."),
    ).toBeTruthy();
    expect(screen.queryByTestId("mock-server-webview")).toBeNull();
  });

  it("should warn when the server is unreachable", async () => {
    endpoints.health.mockImplementation(() => HttpResponse.error());
    renderOverlay();
    await openPanel();

    expect(
      await screen.findByText("Check the server URL in the mock server settings."),
    ).toBeTruthy();
  });

  it("should show the device screen of the pressed device, then hide it", async () => {
    const { store } = renderOverlay({ colorScheme: "dark" });

    fireEvent.press(await screen.findByTestId("mock-server-device-button-2"));

    expect(screen.getByTestId("mock-server-device-screen")).toBeTruthy();
    expect(
      screen.UNSAFE_getByType("MockServerDevice" as unknown as React.ComponentType),
    ).toHaveProp("deviceId", "device-2");

    fireEvent.press(screen.getByTestId("mock-server-device-button-2"));

    expect(store.getState().mockServerOverlay.mode).toEqual({ type: "hidden" });
    expect(screen.queryByTestId("mock-server-device-screen")).toBeNull();
  });

  it("should hide the device screen when its device leaves the session", async () => {
    const { store } = renderOverlay();
    await screen.findByTestId("mock-server-device-button-1");
    act(() => {
      store.dispatch(setMockServerOverlayMode({ type: "device", deviceId: "device-gone" }));
    });

    expect(screen.queryByTestId("mock-server-device-screen")).toBeNull();
  });

  it("should resize the device screen within the window", async () => {
    const { store } = renderOverlay();
    fireEvent.press(await screen.findByTestId("mock-server-device-button-1"));
    const handle = screen.getByTestId("mock-server-device-screen-resize-handle");

    expect(handle.props.onStartShouldSetResponderCapture()).toBe(true);
    expect(handle.props.onStartShouldSetResponder()).toBe(true);
    expect(handle.props.onResponderTerminationRequest()).toBe(false);
    fireEvent(handle, "responderGrant");
    fireEvent(handle, "responderMove", { dx: 60, dy: 0 });

    expect(screen.getByTestId("mock-server-device-screen")).toHaveStyle({ width: 340 });

    fireEvent(handle, "responderMove", { dx: 1000, dy: 0 });
    fireEvent(handle, "responderRelease");

    expect(store.getState().mockServerOverlay.deviceScreenWidth).toBe(400);

    fireEvent(handle, "responderGrant");
    fireEvent(handle, "responderMove", { dx: -1000, dy: 0 });
    fireEvent(handle, "responderTerminate");

    expect(store.getState().mockServerOverlay.deviceScreenWidth).toBe(120);
  });

  it("should move the device screen above the bar when it does not fit below", async () => {
    renderOverlay();
    fireEvent.press(await screen.findByTestId("mock-server-device-button-1"));

    fireEvent(screen.getByTestId("mock-server-device-screen"), "layout", {
      nativeEvent: { layout: { height: 900 } },
    });

    expect(
      findAncestorWithProp(screen.getByTestId("mock-server-device-screen"), "style"),
    ).toHaveStyle({ flexDirection: "column-reverse" });
  });

  it("should only drag the bar past a small move, and keep it on screen", async () => {
    renderOverlay();
    const bar = findAncestorWithProp(
      await screen.findByTestId("mock-server-floating-button"),
      "onMoveShouldSetResponder",
    );

    expect(bar.props.onMoveShouldSetResponder({ dx: 2, dy: 3 })).toBe(false);
    expect(bar.props.onMoveShouldSetResponder({ dx: 0, dy: 20 })).toBe(true);

    fireEvent(bar, "responderGrant");
    fireEvent(bar, "responderMove", { dx: 0, dy: 20 });
    fireEvent(bar, "responderRelease");
    fireEvent(bar, "responderGrant");
    fireEvent(bar, "responderTerminate");

    expect(screen.getByTestId("mock-server-floating-button")).toBeTruthy();
  });
});
