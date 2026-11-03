import {
  createMockServerSession,
  getMockServerSession,
  parseMockServerSessionImport,
  type MockServerSettings,
} from "@features/platform-device-mock-server";

export type MockServerChange = Readonly<{
  settings: MockServerSettings;
  sessionDeviceIds: ReadonlySet<string>;
}>;

export async function joinMockServerSession(url: string, token: string): Promise<MockServerChange> {
  const session = await getMockServerSession({ url, token });
  return {
    settings: { enabled: true, url, token },
    sessionDeviceIds: new Set(session.devices.map(device => device.id)),
  };
}

export async function startMockServerSession(
  url: string,
  { sessionImport, seed }: Readonly<{ sessionImport: unknown; seed?: string }>,
): Promise<MockServerChange> {
  const token = await createMockServerSession({
    url,
    sessionImport: parseMockServerSessionImport(sessionImport),
    seed,
  });
  return joinMockServerSession(url, token);
}

export const disableMockServer = (url: string): MockServerChange => ({
  settings: { enabled: false, url, token: "" },
  sessionDeviceIds: new Set(),
});
