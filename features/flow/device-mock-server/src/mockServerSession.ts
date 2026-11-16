import {
  createMockServerSession,
  getMockServerSession,
  parseMockServerSessionImport,
  type MockServerSettings,
} from "@features/platform-device-mock-server";

/** What the app applies: the settings to save, and the session devices to keep as known devices. */
export type MockServerSessionChange = Readonly<{
  settings: MockServerSettings;
  sessionDeviceIds: ReadonlySet<string>;
}>;

export async function joinMockServerSession(
  url: string,
  token: string,
): Promise<MockServerSessionChange> {
  const session = await getMockServerSession({ url, token });
  return {
    settings: { enabled: true, url, token },
    sessionDeviceIds: new Set(session.devices.map(device => device.id)),
  };
}

export async function startMockServerSession(
  url: string,
  { sessionImport, seed }: Readonly<{ sessionImport: unknown; seed?: string }>,
): Promise<MockServerSessionChange> {
  const token = await createMockServerSession({
    url,
    sessionImport: parseMockServerSessionImport(sessionImport),
    seed,
  });
  return joinMockServerSession(url, token);
}

export const disableMockServer = (url: string): MockServerSessionChange => ({
  settings: { enabled: false, url, token: "" },
  sessionDeviceIds: new Set(),
});
