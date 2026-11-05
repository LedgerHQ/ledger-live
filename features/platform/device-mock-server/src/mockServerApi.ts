import {
  MockClient,
  sessionExportCodec,
  type Device,
  type Session,
  type SessionExport,
} from "@ledgerhq/device-mockserver-client";

const REQUEST_TIMEOUT_MS = 4000;

export type MockServerConfig = { url: string; token: string };
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

const createClient = (url: string, token?: string) =>
  new MockClient(url, { token, timeoutMs: REQUEST_TIMEOUT_MS });

export const createMockServerSession = async ({
  url,
  sessionImport,
  seed,
}: {
  url: string;
  sessionImport: MockServerSessionImport;
  seed?: string;
}): Promise<string> => {
  const client = createClient(url);
  const token = await client.authenticate();

  if (seed) {
    await client.setSeed(seed);
  }
  await client.importSession(sessionImport);

  return token;
};

export const getMockServerSession = ({
  url,
  token,
}: MockServerConfig): Promise<MockServerSession> => createClient(url, token).getSession();

export const listMockServerDevices = ({
  url,
  token,
}: MockServerConfig): Promise<MockServerDevice[]> => createClient(url, token).listDevices();

export const isMockServerReachable = async (url: string): Promise<boolean> => {
  try {
    await createClient(url).getHealth();
    return true;
  } catch {
    return false;
  }
};

export type MockServerConnectionStatus = "connected" | "unreachable" | "sessionExpired";

const REJECTED_TOKEN_STATUSES: ReadonlySet<number> = new Set([401, 403]);

const isRejectedToken = (error: unknown): boolean =>
  error instanceof Error &&
  "status" in error &&
  typeof error.status === "number" &&
  REJECTED_TOKEN_STATUSES.has(error.status);

export const getMockServerStatus = async ({
  url,
  token,
}: MockServerConfig): Promise<{ status: MockServerConnectionStatus; sessionId: string | null }> => {
  if (!(await isMockServerReachable(url))) return { status: "unreachable", sessionId: null };
  try {
    const session = await getMockServerSession({ url, token });
    return { status: "connected", sessionId: session.id };
  } catch (error) {
    return { status: isRejectedToken(error) ? "sessionExpired" : "unreachable", sessionId: null };
  }
};
