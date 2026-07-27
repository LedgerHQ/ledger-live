import { getEnv, changes } from "@shared/env";
import { setNetworkState } from "@ledgerhq/live-network";
import { bridgeEnvToNetworkState } from "./setup";

const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: mockUnsubscribe });

jest.mock("@shared/env", () => ({
  getEnv: jest.fn().mockImplementation((name: string) => {
    const envValues: Record<string, unknown> = {
      ENABLE_NETWORK_LOGS: false,
      DEBUG_HTTP_RESPONSE: true,
      LEDGER_CLIENT_VERSION: "desktop/1.0",
      GET_CALLS_TIMEOUT: 30000,
      GET_CALLS_RETRY: 1,
    };
    return envValues[name];
  }),
  changes: { subscribe: (...args: unknown[]) => mockSubscribe(...args) },
}));

jest.mock("@ledgerhq/live-network", () => ({
  setNetworkState: jest.fn(),
}));

const mockedSetNetworkState = jest.mocked(setNetworkState);

afterEach(() => {
  jest.clearAllMocks();
});

describe("bridgeEnvToNetworkState", () => {
  test("should bridge initial env state to network state", () => {
    bridgeEnvToNetworkState();

    expect(mockedSetNetworkState).toHaveBeenCalledWith({
      enableNetworkLogs: getEnv("ENABLE_NETWORK_LOGS"),
      debugHttpResponse: getEnv("DEBUG_HTTP_RESPONSE"),
      ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
      getCallsTimeout: getEnv("GET_CALLS_TIMEOUT"),
      getCallsRetry: getEnv("GET_CALLS_RETRY"),
    });
  });

  test("should subscribe to env changes", () => {
    bridgeEnvToNetworkState();
    expect(mockSubscribe).toHaveBeenCalled();
  });

  test("should update network state on ENABLE_NETWORK_LOGS change", () => {
    bridgeEnvToNetworkState();
    const [subscriber] = mockSubscribe.mock.calls[0];
    subscriber({ name: "ENABLE_NETWORK_LOGS", value: true });
    expect(mockedSetNetworkState).toHaveBeenLastCalledWith({ enableNetworkLogs: true });
  });

  test("should update network state on DEBUG_HTTP_RESPONSE change", () => {
    bridgeEnvToNetworkState();
    const [subscriber] = mockSubscribe.mock.calls[0];
    subscriber({ name: "DEBUG_HTTP_RESPONSE", value: false });
    expect(mockedSetNetworkState).toHaveBeenLastCalledWith({ debugHttpResponse: false });
  });

  test("should update network state on LEDGER_CLIENT_VERSION change", () => {
    bridgeEnvToNetworkState();
    const [subscriber] = mockSubscribe.mock.calls[0];
    subscriber({ name: "LEDGER_CLIENT_VERSION", value: "wallet-cli/2.0" });
    expect(mockedSetNetworkState).toHaveBeenLastCalledWith({
      ledgerClientVersion: "wallet-cli/2.0",
    });
  });

  test("should update network state on GET_CALLS_TIMEOUT change", () => {
    bridgeEnvToNetworkState();
    const [subscriber] = mockSubscribe.mock.calls[0];
    subscriber({ name: "GET_CALLS_TIMEOUT", value: 90000 });
    expect(mockedSetNetworkState).toHaveBeenLastCalledWith({ getCallsTimeout: 90000 });
  });

  test("should update network state on GET_CALLS_RETRY change", () => {
    bridgeEnvToNetworkState();
    const [subscriber] = mockSubscribe.mock.calls[0];
    subscriber({ name: "GET_CALLS_RETRY", value: 3 });
    expect(mockedSetNetworkState).toHaveBeenLastCalledWith({ getCallsRetry: 3 });
  });

  test("should return a function that unsubscribes from env changes", () => {
    const unsubscribe = bridgeEnvToNetworkState();
    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
