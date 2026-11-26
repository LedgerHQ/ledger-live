/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": [""]}
 */
import { waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { createKeyRingClient } from "@features/platform-key-ring";
import { createKeyRingV1DeviceBridge } from "@features/platform-key-ring/v1";
import { freshKeyRingRuntime } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { LedgerSyncQueryKey } from "../logic/queryKeys";
import { useLedgerSyncServiceStatus } from "./useLedgerSyncServiceStatus";

const KEY_RING_URL = "https://trustchain.test";
const CLOUD_SYNC_URL = "https://cloudsync.test";
const endpoints = {
  keyRingStatus: jest.fn<Response, [{ request: Request }]>(),
  cloudSyncStatus: jest.fn<Response, [{ request: Request }]>(),
};
const server = setupServer(
  http.get(`${KEY_RING_URL}/_info`, info => endpoints.keyRingStatus(info)),
  http.get(`${CLOUD_SYNC_URL}/_info`, info => endpoints.cloudSyncStatus(info)),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  endpoints.keyRingStatus
    .mockReset()
    .mockImplementation(() => HttpResponse.json({ name: "trustchain-backend", version: "1.0.0" }));
  endpoints.cloudSyncStatus
    .mockReset()
    .mockImplementation(() => HttpResponse.json({ name: "cloud-sync", version: "1.0.0" }));
});

// The app client: its status call is the real one, on the client's backend.
const client = createKeyRingClient({
  mock: false,
  instanceName: "Test instance",
  apiBaseUrl: KEY_RING_URL,
  deviceBridge: createKeyRingV1DeviceBridge({
    withDevice: jest.fn(),
    createSessionTransport: jest.fn(),
  }),
  runtime: freshKeyRingRuntime(),
});

function renderStatus(enabled?: boolean) {
  return renderLedgerSyncHook(() =>
    useLedgerSyncServiceStatus({ client, cloudSyncApiBaseUrl: CLOUD_SYNC_URL, enabled }),
  );
}

describe("useLedgerSyncServiceStatus", () => {
  it("should report both backends up", async () => {
    const { result } = renderStatus();

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toEqual({ error: null, isLoading: false, isError: false });
    expect(endpoints.keyRingStatus).toHaveBeenCalledTimes(1);
    expect(endpoints.cloudSyncStatus).toHaveBeenCalledTimes(1);
  });

  it("should cache both statuses under the same query keys", async () => {
    const { result, queryClient } = renderStatus();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(queryClient.getQueryData([LedgerSyncQueryKey.keyRingStatus])).toEqual({
      name: "trustchain-backend",
      version: "1.0.0",
    });
    expect(queryClient.getQueryData([LedgerSyncQueryKey.cloudSyncStatus])).toEqual({
      name: "cloud-sync",
      version: "1.0.0",
    });
  });

  it("should report the failure of the key ring backend as the client rejects it", async () => {
    endpoints.keyRingStatus.mockImplementation(() =>
      HttpResponse.json({ message: "unknown route" }, { status: 404 }),
    );
    const { result } = renderStatus();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ name: "LedgerAPI4xx", message: "unknown route" });
  });

  it("should report the failure of one backend", async () => {
    endpoints.cloudSyncStatus.mockImplementation(() => HttpResponse.json({}, { status: 500 }));
    const { result } = renderStatus();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isLoading).toBe(false);
  });

  it("should fetch nothing when the app disables it", async () => {
    const { result } = renderStatus(false);

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(endpoints.keyRingStatus).not.toHaveBeenCalled();
    expect(endpoints.cloudSyncStatus).not.toHaveBeenCalled();
    expect(result.current).toEqual({ error: null, isLoading: false, isError: false });
  });

  it("should fetch both statuses when the app enables it", async () => {
    const { result } = renderStatus(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(endpoints.keyRingStatus).toHaveBeenCalledTimes(1);
    expect(endpoints.cloudSyncStatus).toHaveBeenCalledTimes(1);
  });
});
