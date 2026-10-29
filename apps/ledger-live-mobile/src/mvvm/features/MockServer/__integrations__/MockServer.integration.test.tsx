import React from "react";
import { Alert, Platform, Text } from "react-native";
import RNRestart from "react-native-restart";
import { act, fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import {
  configureMockServerTransport,
  mockserverIdentifier,
  resetMockServerTransport,
} from "@ledgerhq/live-dmk-mobile";
import QueuedDrawer from "LLM/components/QueuedDrawer";
import { MockServerOverlay, MockServerSettingsRow } from "..";
import { openMockServerPanel, resetMockServerPanelState } from "../utils/mockServerPanelStore";

jest.mock("react-native-restart", () => ({ __esModule: true, default: { restart: jest.fn() } }));

const MOCK_SERVER_URL = "https://mock-server.test";

const staxDevice = {
  id: "device-1",
  name: "Mock Stax",
  device_type: "stax",
  connectivity_type: "USB",
};

const endpoints = {
  health: jest.fn<Response, [{ request: Request }]>(),
  session: jest.fn<Response, [{ request: Request }]>(),
  auth: jest.fn<Response, [{ request: Request }]>(),
  import: jest.fn<Response, [{ request: Request }]>(),
};

describe("MockServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    endpoints.health.mockReset().mockImplementation(() => HttpResponse.json({ status: "ok" }));
    endpoints.session
      .mockReset()
      .mockImplementation(() =>
        HttpResponse.json({ id: "session-1", expires_at: 0, devices: [staxDevice] }),
      );
    endpoints.auth.mockReset().mockImplementation(() => HttpResponse.json({ token: "token-2" }));
    endpoints.import.mockReset().mockImplementation(() => HttpResponse.json({}));
    server.use(
      http.get(`${MOCK_SERVER_URL}/health`, endpoints.health),
      http.get(`${MOCK_SERVER_URL}/sessions/current`, endpoints.session),
      http.post(`${MOCK_SERVER_URL}/auth`, endpoints.auth),
      http.post(`${MOCK_SERVER_URL}/import`, endpoints.import),
    );
  });

  afterEach(() => {
    resetMockServerTransport();
    act(() => resetMockServerPanelState());
  });

  describe("panel", () => {
    beforeEach(() => {
      configureMockServerTransport({ url: MOCK_SERVER_URL, token: "token-1" });
    });

    it("should render nothing when the mock server transport is not configured", () => {
      resetMockServerTransport();
      render(<MockServerOverlay />);
      act(() => openMockServerPanel());

      expect(screen.queryByTestId("mock-server-panel")).toBeNull();
    });

    it("should show the connected session when the panel opens", async () => {
      render(<MockServerOverlay />);
      act(() => openMockServerPanel());

      expect(await screen.findByText("Connected · session session-1")).toBeVisible();
      expect(endpoints.session.mock.calls[0][0].request.headers.get("Authorization")).toBe(
        "Bearer token-1",
      );
    });

    it("should warn that the session expired when the server rejects the token", async () => {
      endpoints.session.mockImplementation(() => HttpResponse.json({}, { status: 401 }));
      render(<MockServerOverlay />);
      act(() => openMockServerPanel());

      expect(
        await screen.findByText("Start a new session to keep using the mock server."),
      ).toBeVisible();
    });

    it("should record the session devices and restart when starting a new session", async () => {
      const { store, user } = render(<MockServerOverlay />);
      act(() => openMockServerPanel());

      await user.press(await screen.findByText("New session"));

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(store.getState().settings.mockServer).toEqual({
        enabled: true,
        url: MOCK_SERVER_URL,
        token: "token-2",
      });
      expect(store.getState().knownDevices.knownDevices).toContainEqual({
        transport: mockserverIdentifier,
        id: "device-1",
        name: "Mock Stax",
        deviceModelId: "stax",
      });
    });

    it("should join the pasted session without creating one when applying a new token", async () => {
      const { store, user } = render(<MockServerOverlay />);
      act(() => openMockServerPanel());

      const tokenInput = await screen.findByDisplayValue("token-1");
      await user.clear(tokenInput);
      await user.type(tokenInput, "shared-token");
      await user.press(screen.getByText("Apply & restart"));

      await waitFor(() => expect(RNRestart.restart).toHaveBeenCalledTimes(1));
      expect(endpoints.auth).not.toHaveBeenCalled();
      expect(store.getState().settings.mockServer.token).toBe("shared-token");
    });
  });

  describe("inside a native modal drawer", () => {
    beforeEach(() => {
      configureMockServerTransport({ url: MOCK_SERVER_URL, token: "token-1" });
    });

    it("should show the floating button inside an open drawer on Android", async () => {
      jest.replaceProperty(Platform, "OS", "android");
      render(
        <QueuedDrawer isRequestingToBeOpened>
          <Text>Drawer content</Text>
        </QueuedDrawer>,
      );

      expect(await screen.findByTestId("mock-server-floating-button")).toBeVisible();
    });
  });

  describe("settings row", () => {
    it("should start a session on the default server and restart when turned on", async () => {
      jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
        buttons?.find(button => button.text === "Restart")?.onPress?.();
      });
      const { store } = render(<MockServerSettingsRow />, {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            mockServer: { enabled: false, url: MOCK_SERVER_URL, token: "" },
          },
        }),
      });

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
      const { store } = render(<MockServerSettingsRow />, {
        overrideInitialState: state => ({
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
        }),
      });

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
