/**
 * @jest-environment node
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  createMockServerSession,
  getMockServerFrontendUrl,
  getMockServerSession,
  isMockServerReachable,
} from "./mockServerApi";

const URL = "https://mock.example";

const endpoints = {
  auth: jest.fn<Response, [{ request: Request }]>(),
  seed: jest.fn<Response, [{ request: Request }]>(),
  import: jest.fn<Response, [{ request: Request }]>(),
  session: jest.fn<Response, [{ request: Request }]>(),
  health: jest.fn<Response, [{ request: Request }]>(),
};

const server = setupServer(
  http.post(`${URL}/auth`, endpoints.auth),
  http.put(`${URL}/sessions/current/seed`, endpoints.seed),
  http.post(`${URL}/import`, endpoints.import),
  http.get(`${URL}/sessions/current`, endpoints.session),
  http.get(`${URL}/health`, endpoints.health),
);

describe("mockServerApi", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterAll(() => server.close());

  beforeEach(() => {
    endpoints.auth.mockReset().mockImplementation(() => HttpResponse.json({ token: "token-1" }));
    endpoints.seed.mockReset().mockImplementation(() => HttpResponse.json({}));
    endpoints.import.mockReset().mockImplementation(() => HttpResponse.json({}));
    endpoints.session.mockReset();
    endpoints.health.mockReset().mockImplementation(() => HttpResponse.json({ status: "ok" }));
  });

  it("should authorize the seed and the import requests with the token from /auth", async () => {
    const sessionImport = { devices: [{ device_type: "stax" }] };

    const token = await createMockServerSession({ url: URL, sessionImport, seed: "abandon" });

    expect(token).toBe("token-1");
    const seedRequest = endpoints.seed.mock.calls[0][0].request;
    expect(seedRequest.headers.get("Authorization")).toBe("Bearer token-1");
    expect(await seedRequest.json()).toEqual({ seed: "abandon" });
    const importRequest = endpoints.import.mock.calls[0][0].request;
    expect(importRequest.headers.get("Authorization")).toBe("Bearer token-1");
    expect(await importRequest.json()).toEqual(sessionImport);
  });

  it("should not seed the session when no seed is given", async () => {
    await createMockServerSession({ url: URL, sessionImport: { devices: [] } });

    expect(endpoints.seed).not.toHaveBeenCalled();
    expect(endpoints.import).toHaveBeenCalledTimes(1);
  });

  it("should fail when the server returns no token", async () => {
    endpoints.auth.mockImplementation(() => HttpResponse.json({}));

    await expect(
      createMockServerSession({ url: URL, sessionImport: { devices: [] } }),
    ).rejects.toThrow("no session token");
  });

  it("should return the current session when the token is valid", async () => {
    endpoints.session.mockImplementation(() =>
      HttpResponse.json({ id: "session-1", expires_at: 0, devices: [] }),
    );

    await expect(getMockServerSession({ url: URL, token: "token-1" })).resolves.toMatchObject({
      id: "session-1",
    });
    expect(endpoints.session.mock.calls[0][0].request.headers.get("Authorization")).toBe(
      "Bearer token-1",
    );
  });

  it("should reject when the session token has expired", async () => {
    endpoints.session.mockImplementation(() => HttpResponse.json({}, { status: 401 }));

    await expect(getMockServerSession({ url: URL, token: "expired" })).rejects.toThrow("401");
  });

  it("should report the server as unreachable when the health check fails", async () => {
    endpoints.health.mockImplementation(() => HttpResponse.error());

    await expect(isMockServerReachable(URL)).resolves.toBe(false);
  });

  it("should pass the token to the frontend in the url hash", () => {
    expect(getMockServerFrontendUrl(URL, "a b")).toBe(`${URL}/#token=a%20b`);
  });
});
