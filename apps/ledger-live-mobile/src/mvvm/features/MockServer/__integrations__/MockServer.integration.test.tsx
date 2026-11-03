import React from "react";
import { Alert } from "react-native";
import RNRestart from "react-native-restart";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import { mockserverIdentifier } from "@ledgerhq/live-dmk-mobile";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MockServerSettingsScreen } from "..";
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

const Stack = createNativeStackNavigator<SettingsNavigatorStackParamList>();

const renderSettingsScreen = (overrideInitialState: (state: State) => State) =>
  render(
    <Stack.Navigator>
      <Stack.Screen name={ScreenName.DebugMockServer} component={MockServerSettingsScreen} />
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
      jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
        buttons?.find(button => button.text === "Restart")?.onPress?.();
      });
      const { store } = renderSettingsScreen(state => ({
        ...state,
        settings: {
          ...state.settings,
          mockServer: { enabled: false, url: MOCK_SERVER_URL, token: "" },
        },
      }));

      fireEvent(screen.getByTestId("mock-server-toggle"), "valueChange", true);

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

      fireEvent(screen.getByTestId("mock-server-toggle"), "valueChange", false);

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(store.getState().settings.mockServer).toEqual({
        enabled: false,
        url: MOCK_SERVER_URL,
        token: "",
      });
      expect(store.getState().knownDevices.knownDevices).toEqual([]);
    });
  });
});
