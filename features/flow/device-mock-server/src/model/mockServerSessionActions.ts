import {
  createMockServerSession,
  getMockServerSession,
  parseMockServerSessionImport,
} from "@features/platform-device-mock-server";
import type { MockServerHost } from "./ports";

export type MockServerSessionActions = Readonly<{
  startNewSession: (url: string) => Promise<void>;
  joinSession: (url: string, token: string) => Promise<void>;
  disable: (url: string) => Promise<void>;
}>;

/** Every action ends with an app restart: the DMK only picks up the mock server transport at build time. */
export function createMockServerSessionActions(host: MockServerHost): MockServerSessionActions {
  const joinSession = async (url: string, token: string) => {
    const session = await getMockServerSession({ url, token });
    host.forgetDevicesExcept(new Set(session.devices.map(device => device.id)));
    host.saveSettings({ enabled: true, url, token });
    await host.persistAndRestart();
  };

  const startNewSession = async (url: string) => {
    const { sessionImport, seed } = host.getSessionDefaults();
    const token = await createMockServerSession({
      url,
      sessionImport: parseMockServerSessionImport(sessionImport),
      seed,
    });
    await joinSession(url, token);
  };

  const disable = async (url: string) => {
    host.forgetDevicesExcept(new Set());
    host.saveSettings({ enabled: false, url, token: "" });
    await host.persistAndRestart();
  };

  return { startNewSession, joinSession, disable };
}
