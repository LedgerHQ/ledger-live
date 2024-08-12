import { MockSDK } from "@ledgerhq/trustchain/mockSdk";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { emptyState, convertLocalToDistantState } from "../__mocks__";
import { trustchainLifecycle } from "..";
import { getEnv } from "@ledgerhq/live-env";

describe("trustchainLifecycle", () => {
  let removedCount = 0;
  let storedData: string | null = null;
  let storedVersion = 0;

  const handlers = [
    http.delete("http://localhost/atomic/v1/:slug", ({ request }) => {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== "Bearer old-jwt") {
        return HttpResponse.json({}, { status: 401 });
      }
      removedCount++;
      storedData = null;
      storedVersion = 0;
      return new HttpResponse(null, { status: 204 });
    }),
    http.post("http://localhost/atomic/v1/:slug", async ({ request }) => {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== "Bearer new-jwt") {
        return HttpResponse.json({}, { status: 401 });
      }
      const version = parseInt(new URL(request.url).searchParams.get("version") || "0", 10);
      const json = await request.json();
      const { payload } = json as { payload: string };
      storedData = payload;
      storedVersion = version;
      return HttpResponse.json({ status: "updated" });
    }),
  ];

  let mswServer: ReturnType<typeof setupServer>;
  beforeAll(() => {
    mswServer = setupServer(...handlers);
    mswServer.listen();
  });

  afterAll(() => {
    mswServer.close();
  });

  it("should delete old data and upload new data on trustchain rotation", async () => {
    const mockGetCurrentWSState = () => ({
      version: 42,
      data: convertLocalToDistantState(emptyState),
    });

    const mockTrustchainSdk = new MockSDK({
      applicationId: 16,
      name: "user",
      apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
    });
    const creds = await mockTrustchainSdk.initMemberCredentials();

    const lifecycle = trustchainLifecycle({
      cloudSyncApiBaseUrl: "http://localhost",
      getCurrentWSState: mockGetCurrentWSState,
    });

    const oldTrustchain = {
      rootId: "mock-root-id-old",
      walletSyncEncryptionKey: "old-encryption-key",
      applicationPath: "old-application-path",
    };

    const newTrustchain = {
      rootId: "mock-root-id-new",
      walletSyncEncryptionKey: "new-encryption-key",
      applicationPath: "new-application-path",
    };

    mockTrustchainSdk.withAuth = (_t, _m, job) => job({ accessToken: "old-jwt", permissions: {} });
    const afterRotation = await lifecycle.onTrustchainRotation(
      mockTrustchainSdk,
      oldTrustchain,
      creds,
    );
    mockTrustchainSdk.withAuth = (_t, _m, job) => job({ accessToken: "new-jwt", permissions: {} });
    await afterRotation(newTrustchain);

    expect(removedCount).toBe(1);
    expect(storedData).not.toBe("");
    expect(storedVersion).toBe(42);
  });
});
