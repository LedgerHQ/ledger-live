import {
  MockClient,
  sessionExportCodec,
  type Device,
  type Session,
  type SessionExport,
} from "@ledgerhq/device-mockserver-client";

const REQUEST_TIMEOUT_MS = 4000;

export type MockServerDevice = Device;
export type MockServerSession = Session;
export type MockServerSessionImport = SessionExport;

export const parseMockServerSessionImport = (value: unknown): MockServerSessionImport =>
  sessionExportCodec.decode(value).caseOf({
    Left: error => {
      throw new Error(`Invalid mock server session import: ${error}`);
    },
    Right: sessionImport => sessionImport,
  });

/** For the two endpoints `MockClient` does not cover: the session seed and the health check. */
const request = async (
  url: string,
  path: string,
  { method = "GET", token, body }: { method?: "GET" | "PUT"; token?: string; body?: unknown } = {},
): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Mock server ${method} /${path} failed with status ${response.status}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

/** Creates a session, optionally seeds it, imports its devices and returns its bearer token. */
export const createMockServerSession = async ({
  url,
  sessionImport,
  seed,
}: {
  url: string;
  sessionImport: MockServerSessionImport;
  seed?: string;
}): Promise<string> => {
  const client = new MockClient(url);
  const token = await client.authenticate();

  if (seed) {
    await request(url, "sessions/current/seed", { method: "PUT", token, body: { seed } });
  }
  await client.importSession(sessionImport);

  return token;
};

export const getMockServerSession = ({
  url,
  token,
}: {
  url: string;
  token: string;
}): Promise<MockServerSession> => new MockClient(url, { token }).getSession();

export const listMockServerDevices = ({
  url,
  token,
}: {
  url: string;
  token: string;
}): Promise<MockServerDevice[]> => new MockClient(url, { token }).listDevices();

export const isMockServerReachable = async (url: string): Promise<boolean> => {
  try {
    await request(url, "health");
    return true;
  } catch {
    return false;
  }
};

export const getMockServerFrontendUrl = (url: string, token: string): string =>
  `${url}/#token=${encodeURIComponent(token)}`;
