import React from "react";
import { Alert, Linking, Platform, Text } from "react-native";
import RNRestart from "react-native-restart";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import { mockserverIdentifier } from "@ledgerhq/live-dmk-mobile";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MockServerOverlay, MockServerSettingsScreen } from "..";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

jest.mock("react-native-restart", () => ({ __esModule: true, default: { restart: jest.fn() } }));

const MOCK_SERVER_URL = "https://mock-server.test";

const staxDevice = {
  id: "device-1",
  name: "Mock Stax",
  device_type: "stax",
  connectivity_type: "USB",
};

const withMockServerOn = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    mockServer: { enabled: true, url: MOCK_SERVER_URL, token: "token-1" },
  },
});

const withOpenPanel = (state: State): State => ({
  ...withMockServerOn(state),
  mockServerOverlay: { ...state.mockServerOverlay, mode: { type: "main" } },
});

const Stack = createNativeStackNavigator<SettingsNavigatorStackParamList>();

const withMockServerOff = (state: State): State => ({
  ...state,
  settings: { ...state.settings, mockServer: { enabled: false, url: "", token: "" } },
});

const renderSettingsScreen = (
  overrideInitialState: (state: State) => State,
  initialParams?: SettingsNavigatorStackParamList[ScreenName.DebugMockServer],
) =>
  render(
    <Stack.Navigator>
      <Stack.Screen
        name={ScreenName.DebugMockServer}
        component={MockServerSettingsScreen}
        initialParams={initialParams}
      />
    </Stack.Navigator>,
    { overrideInitialState },
  );

const endpoints = {
  health: jest.fn<Response, [{ request: Request }]>(),
  session: jest.fn<Response, [{ request: Request }]>(),
  auth: jest.fn<Response, [{ request: Request }]>(),
  import: jest.fn<Response, [{ request: Request }]>(),
};

describe("MockServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    endpoints.health
      .mockReset()
      .mockImplementation(() => HttpResponse.json({ status: "ok", sessions: 0 }));
    endpoints.session
      .mockReset()
      .mockImplementation(() =>
        HttpResponse.json({ id: "session-1", created_at: 0, expires_at: 0, devices: [staxDevice] }),
      );
    endpoints.auth
      .mockReset()
      .mockImplementation(() => HttpResponse.json({ token: "token-2", expires_at: 0 }));
    endpoints.import.mockReset().mockImplementation(() => HttpResponse.json({ devices: [] }));
    server.use(
      http.get(`${MOCK_SERVER_URL}/health`, endpoints.health),
      http.get(`${MOCK_SERVER_URL}/sessions/current`, endpoints.session),
      http.post(`${MOCK_SERVER_URL}/auth`, endpoints.auth),
      http.post(`${MOCK_SERVER_URL}/import`, endpoints.import),
    );
  });

  describe("panel", () => {
    it("should render nothing when the mock server is off", () => {
      render(<MockServerOverlay />, {
        overrideInitialState: state => ({
          ...state,
          mockServerOverlay: { ...state.mockServerOverlay, mode: { type: "main" } },
        }),
      });

      expect(screen.queryByTestId("mock-server-panel")).toBeNull();
    });

    it("should show the connected status when the panel opens", async () => {
      render(<MockServerOverlay />, { overrideInitialState: withOpenPanel });

      expect(await screen.findByText("Connected")).toBeVisible();
      expect(endpoints.session.mock.calls[0][0].request.headers.get("Authorization")).toBe(
        "Bearer token-1",
      );
    });

    it("should hide the panel when the floating button is pressed", async () => {
      const { store, user } = render(<MockServerOverlay />, {
        overrideInitialState: withOpenPanel,
      });

      await user.press(await screen.findByTestId("mock-server-floating-button"));

      expect(
        screen.getByTestId("mock-server-panel", { includeHiddenElements: true }),
      ).not.toBeVisible();
      expect(store.getState().mockServerOverlay.mode).toEqual({ type: "hidden" });
    });

    it("should open the session's configuration UI in the browser and keep the panel open", async () => {
      const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
      const { user } = render(<MockServerOverlay />, { overrideInitialState: withOpenPanel });

      await user.press(
        await screen.findByLabelText("Open the mock server configuration in the browser"),
      );

      expect(openURL).toHaveBeenCalledWith(`${MOCK_SERVER_URL}/#token=token-1`);
      expect(screen.getByTestId("mock-server-panel")).toBeVisible();
    });

    it("should warn that the session expired when the server rejects the token", async () => {
      endpoints.session.mockImplementation(() => HttpResponse.json({}, { status: 401 }));
      render(<MockServerOverlay />, { overrideInitialState: withOpenPanel });

      expect(
        await screen.findByText("Start a new session to keep using the mock server."),
      ).toBeVisible();
    });
  });

  describe("inside a native modal drawer", () => {
    it("should show the floating button inside an open drawer on Android", async () => {
      jest.replaceProperty(Platform, "OS", "android");
      render(
        <QueuedDrawer isRequestingToBeOpened>
          <Text>Drawer content</Text>
        </QueuedDrawer>,
        { overrideInitialState: withMockServerOn },
      );

      expect(await screen.findByTestId("mock-server-floating-button")).toBeVisible();
    });
  });

  describe("settings screen", () => {
    it("should forget the previous session devices and restart when starting a new session", async () => {
      const { store, user } = renderSettingsScreen(state => ({
        ...withMockServerOn(state),
        knownDevices: {
          knownDevices: [
            {
              transport: mockserverIdentifier,
              id: "previous-session-device",
              name: "Mock Stax",
              deviceModelId: staxDevice.device_type as never,
            },
          ],
        },
      }));

      await user.press(await screen.findByText("New session"));

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(store.getState().settings.mockServer).toEqual({
        enabled: true,
        url: MOCK_SERVER_URL,
        token: "token-2",
      });
      expect(store.getState().knownDevices.knownDevices).toEqual([]);
    });

    it("should join the pasted session without creating one when applying a new token", async () => {
      const { store, user } = renderSettingsScreen(withMockServerOn);

      const tokenInput = await screen.findByDisplayValue("token-1");
      await user.clear(tokenInput);
      await user.type(tokenInput, "shared-token");
      await user.press(screen.getByText("Apply & restart"));

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(endpoints.auth).not.toHaveBeenCalled();
      expect(store.getState().settings.mockServer.token).toBe("shared-token");
    });

    it("should start a session on the default server and restart when turned on", async () => {
      const { store, user } = renderSettingsScreen(state => ({
        ...state,
        settings: {
          ...state.settings,
          mockServer: { enabled: false, url: MOCK_SERVER_URL, token: "" },
        },
      }));

      fireEvent.press(screen.getByTestId("mock-server-toggle"));
      await user.press(await screen.findByText("I understand, restart"));

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(endpoints.auth).toHaveBeenCalledTimes(1);
      expect(store.getState().settings.mockServer).toEqual({
        enabled: true,
        url: MOCK_SERVER_URL,
        token: "token-2",
      });
    });

    it("should remove the mock devices and restart when turned off", async () => {
      jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
        buttons?.find(button => button.text === "Restart")?.onPress?.();
      });
      const { store } = renderSettingsScreen(state => ({
        ...state,
        settings: {
          ...state.settings,
          mockServer: { enabled: true, url: MOCK_SERVER_URL, token: "token-1" },
        },
        knownDevices: {
          knownDevices: [
            {
              transport: mockserverIdentifier,
              id: "device-1",
              name: "Mock Stax",
              deviceModelId: staxDevice.device_type as never,
            },
          ],
        },
      }));

      fireEvent.press(screen.getByTestId("mock-server-toggle"));

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(store.getState().settings.mockServer).toEqual({
        enabled: false,
        url: MOCK_SERVER_URL,
        token: "",
      });
      expect(store.getState().knownDevices.knownDevices).toEqual([]);
    });
  });

  describe("deeplink activation", () => {
    it("should join the linked session without creating one once the warning is confirmed", async () => {
      const { store, user } = renderSettingsScreen(withMockServerOff, {
        url: MOCK_SERVER_URL,
        token: "shared-token",
      });

      expect(await screen.findByText("Mock devices have no security")).toBeVisible();
      await user.press(screen.getByText("I understand, restart"));

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(endpoints.auth).not.toHaveBeenCalled();
      expect(store.getState().settings.mockServer).toEqual({
        enabled: true,
        url: MOCK_SERVER_URL,
        token: "shared-token",
      });
    });

    it("should start a session on the linked server when the link has no token", async () => {
      const { store, user } = renderSettingsScreen(withMockServerOff, { url: MOCK_SERVER_URL });

      await user.press(await screen.findByText("I understand, restart"));

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(endpoints.auth).toHaveBeenCalledTimes(1);
      expect(store.getState().settings.mockServer).toEqual({
        enabled: true,
        url: MOCK_SERVER_URL,
        token: "token-2",
      });
    });

    it("should leave the settings unchanged when the warning is cancelled", async () => {
      const { store, user } = renderSettingsScreen(withMockServerOff, {
        url: MOCK_SERVER_URL,
        token: "shared-token",
      });

      await user.press(await screen.findByText("Cancel"));

      expect(RNRestart.restart).not.toHaveBeenCalled();
      expect(store.getState().settings.mockServer).toEqual({ enabled: false, url: "", token: "" });
    });

    it("should keep the settings and the linked token for a retry when the server rejects it", async () => {
      endpoints.session.mockImplementation(() => HttpResponse.json({}, { status: 401 }));
      const { store, user } = renderSettingsScreen(withMockServerOff, {
        url: MOCK_SERVER_URL,
        token: "shared-token",
      });

      await user.press(await screen.findByText("I understand, restart"));

      expect(await screen.findByText("Mock server error")).toBeVisible();
      expect(RNRestart.restart).not.toHaveBeenCalled();
      expect(store.getState().settings.mockServer).toEqual({ enabled: false, url: "", token: "" });
      expect(screen.getByDisplayValue("shared-token")).toBeVisible();
    });

    it("should treat a link that matches the active session as handled", async () => {
      const { store, user } = renderSettingsScreen(withMockServerOn, {
        url: MOCK_SERVER_URL,
        token: "token-1",
      });

      await user.press(await screen.findByText("I understand, restart"));

      expect(RNRestart.restart).not.toHaveBeenCalled();
      expect(store.getState().settings.mockServer).toEqual({
        enabled: true,
        url: MOCK_SERVER_URL,
        token: "token-1",
      });
    });
  });
});
