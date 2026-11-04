import React from "react";
import { Alert, Linking } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { MockServerSessionChange } from "../../mockServerSession";
import { MockServerSettingsForm } from "./MockServerSettingsForm";
import type { MockServerSettingsFormProps } from "./types";

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  Alert: { alert: jest.fn() },
}));

const SERVER_URL = "https://mock-server.test";
const stax = { id: "device-1", name: "Mock Stax", device_type: "stax", connectivity_type: "USB" };

const endpoints = {
  health: jest.fn<Response, []>(),
  session: jest.fn<Response, []>(),
  auth: jest.fn<Response, []>(),
  import: jest.fn<Response, []>(),
};

const server = setupServer(
  http.get(`${SERVER_URL}/health`, () => endpoints.health()),
  http.get(`${SERVER_URL}/sessions/current`, () => endpoints.session()),
  http.post(`${SERVER_URL}/auth`, () => endpoints.auth()),
  http.post(`${SERVER_URL}/import`, () => endpoints.import()),
);

const enabledSettings = { enabled: true, url: SERVER_URL, token: "token-1" };
const disabledSettings = { enabled: false, url: "", token: "" };

const renderForm = (props: Partial<MockServerSettingsFormProps> = {}) => {
  const onApply = jest.fn<Promise<void>, [MockServerSessionChange]>().mockResolvedValue(undefined);
  render(
    <MockServerSettingsForm
      settings={enabledSettings}
      defaultUrl={SERVER_URL}
      sessionImport={{ devices: [] }}
      onApply={onApply}
      {...props}
    />,
  );
  return { onApply };
};

const confirmRestart = () =>
  jest.mocked(Alert.alert).mockImplementation((_title, _message, buttons) => {
    buttons?.find(button => button.text === "Restart")?.onPress?.();
  });

describe("MockServerSettingsForm", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  beforeEach(() => {
    jest.clearAllMocks();
    endpoints.health.mockImplementation(() => HttpResponse.json({ status: "ok", sessions: 0 }));
    endpoints.session.mockImplementation(() =>
      HttpResponse.json({ id: "session-1", created_at: 0, expires_at: 0, devices: [stax] }),
    );
    endpoints.auth.mockImplementation(() => HttpResponse.json({ token: "token-2", expires_at: 0 }));
    endpoints.import.mockImplementation(() => HttpResponse.json({ devices: [] }));
  });

  it("should show the status and the session id when the mock server is on", async () => {
    renderForm();

    expect(await screen.findByText("Connected")).toBeTruthy();
    expect(screen.getByText("Session ID: session-1")).toBeTruthy();
  });

  it("should report an expired session when the server rejects the token", async () => {
    endpoints.session.mockImplementation(() => HttpResponse.json({}, { status: 401 }));

    renderForm();

    expect(await screen.findByText("Session expired")).toBeTruthy();
  });

  it("should start a session and apply it when turned on", async () => {
    confirmRestart();
    const { onApply } = renderForm({ settings: disabledSettings });

    fireEvent(screen.getByTestId("mock-server-toggle"), "checkedChange", true);

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        settings: { enabled: true, url: SERVER_URL, token: "token-2" },
        sessionDeviceIds: new Set(["device-1"]),
      }),
    );
  });

  it("should join the typed session without creating one when applied", async () => {
    const { onApply } = renderForm();

    fireEvent.changeText(await screen.findByDisplayValue("token-1"), "shared-token");
    fireEvent.press(screen.getByText("Apply & restart"));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        settings: { enabled: true, url: SERVER_URL, token: "shared-token" },
        sessionDeviceIds: new Set(["device-1"]),
      }),
    );
    expect(endpoints.auth).not.toHaveBeenCalled();
  });

  it("should start a new session on the current server", async () => {
    const { onApply } = renderForm();

    fireEvent.press(await screen.findByText("New session"));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        settings: { enabled: true, url: SERVER_URL, token: "token-2" },
        sessionDeviceIds: new Set(["device-1"]),
      }),
    );
  });

  it("should forget every mock device when turned off", async () => {
    confirmRestart();
    const { onApply } = renderForm();

    fireEvent(screen.getByTestId("mock-server-toggle"), "checkedChange", false);

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        settings: { enabled: false, url: SERVER_URL, token: "" },
        sessionDeviceIds: new Set(),
      }),
    );
  });

  it("should show the error and apply nothing when the session cannot be joined", async () => {
    endpoints.session.mockImplementation(() => HttpResponse.json({}, { status: 401 }));
    const { onApply } = renderForm();

    fireEvent.changeText(await screen.findByDisplayValue("token-1"), "rejected-token");
    fireEvent.press(screen.getByText("Apply & restart"));

    expect(await screen.findByText("Mock server error")).toBeTruthy();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("should open the session's configuration UI in the browser", async () => {
    renderForm();

    fireEvent.press(await screen.findByText("Open in browser"));

    expect(Linking.openURL).toHaveBeenCalledWith(`${SERVER_URL}/#token=token-1`);
  });
});
