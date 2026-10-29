const REQUEST_TIMEOUT_MS = 4000;

export type MockServerDevice = {
  id: string;
  name: string;
  device_type: string;
  connectivity_type: string;
  connected?: boolean;
};

export type MockServerSession = {
  id: string;
  expires_at: number;
  devices: MockServerDevice[];
};

export type MockServerSessionImport = {
  devices: unknown[];
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT";
  token?: string;
  body?: unknown;
};

const request = async <T>(
  url: string,
  path: string,
  { method = "GET", token, body }: RequestOptions = {},
): Promise<T> => {
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
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
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
  const { token } = await request<{ token?: string }>(url, "auth", { method: "POST", body: {} });
  if (!token) throw new Error("Mock server returned no session token");

  if (seed) {
    await request(url, "sessions/current/seed", { method: "PUT", token, body: { seed } });
  }
  await request(url, "import", { method: "POST", token, body: sessionImport });

  return token;
};

export const getMockServerSession = ({
  url,
  token,
}: {
  url: string;
  token: string;
}): Promise<MockServerSession> => request(url, "sessions/current", { token });

export const listMockServerDevices = ({
  url,
  token,
}: {
  url: string;
  token: string;
}): Promise<MockServerDevice[]> => request(url, "devices", { token });

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
