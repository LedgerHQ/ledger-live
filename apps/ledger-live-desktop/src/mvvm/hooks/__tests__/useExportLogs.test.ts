import { act, renderHook } from "tests/testSetup";
import { useExportLogs } from "../useExportLogs";
import { UserId } from "@ledgerhq/client-ids/ids";
import { initialIdentitiesState } from "@ledgerhq/client-ids/store";
import type { State } from "~/renderer/reducers";
import logger from "~/renderer/logger";
import { saveLogs } from "~/helpers/saveLogs";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  CountervaluesProvider: ({ children }: { children: React.ReactNode }) => children,
  useCountervaluesPolling: () => ({}),
}));

jest.mock("@ledgerhq/live-countervalues-react/CountervaluesMarketcapProvider", () => ({
  CountervaluesMarketcapProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: {
    log: jest.fn(),
    critical: jest.fn(),
  },
}));

jest.mock("~/renderer/hooks/useDateFormatter", () => ({
  useTechnicalDateTimeFn: () => () => "2020-01-01T00:00:00.000Z",
}));

jest.mock("electron", () => ({
  webFrame: { getResourceUsage: jest.fn(() => ({})) },
  ipcRenderer: {
    invoke: jest.fn(() => Promise.resolve(undefined)),
  },
}));

jest.mock("~/helpers/saveLogs", () => ({
  saveLogs: jest.fn(() => Promise.resolve()),
}));

const mockLoggerLog = jest.mocked(logger.log);
const mockSaveLogs = jest.mocked(saveLogs);

const testUserId = UserId.fromString("test-user-for-export-logs");
const testAccounts = [{ id: "account-1" }, { id: "account-2" }] as State["accounts"];

const defaultInitialState: Partial<State> = {
  identities: {
    ...initialIdentitiesState,
    userId: testUserId,
  },
  accounts: testAccounts,
};

describe("useExportLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports meta payload with userAnonymousId from userId.exportUserIdForUserLogs()", async () => {
    const { result } = renderHook(() => useExportLogs(), {
      initialState: defaultInitialState,
    });

    await act(async () => {
      await result.current.handleExportLogs();
    });

    expect(mockLoggerLog).toHaveBeenCalledWith(
      "exportLogsMeta",
      expect.objectContaining({
        userAnonymousId: testUserId.exportUserIdForUserLogs(),
      }),
    );
    expect(mockSaveLogs).not.toHaveBeenCalled(); // dialog returns undefined so no path to save
  });

  it("includes accountsIds and env in the exported meta payload", async () => {
    const { result } = renderHook(() => useExportLogs(), {
      initialState: defaultInitialState,
    });

    await act(async () => {
      await result.current.handleExportLogs();
    });

    const metaCall = mockLoggerLog.mock.calls.find(call => call[0] === "exportLogsMeta");
    expect(metaCall).toBeDefined();
    const payload = metaCall![1] as Record<string, unknown>;
    expect(payload.accountsIds).toEqual(["account-1", "account-2"]);
    expect(payload.env).toBeDefined();
    expect(typeof payload.env).toBe("object");
  });

  it("includes resourceUsage, release, environment and userAgent in meta", async () => {
    const { result } = renderHook(() => useExportLogs(), {
      initialState: defaultInitialState,
    });

    await act(async () => {
      await result.current.handleExportLogs();
    });

    const metaCall = mockLoggerLog.mock.calls.find(call => call[0] === "exportLogsMeta");
    expect(metaCall).toBeDefined();
    const payload = metaCall![1] as Record<string, unknown>;
    expect(payload).toHaveProperty("resourceUsage");
    expect(payload).toHaveProperty("release");
    expect(payload).toHaveProperty("environment");
    expect(payload).toHaveProperty("userAgent");
  });
});
