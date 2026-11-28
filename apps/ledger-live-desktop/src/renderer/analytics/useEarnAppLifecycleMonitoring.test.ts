import { http, HttpResponse } from "msw";
import {
  clearPendingTxLifecycle,
  emitTransactionEvent,
  registerTxLifecycleObserver,
  resetTransactionObservers,
  setEarnTxLifecycleFlagReader,
  setTxLifecycleBaseUrl,
  TransactionDataSource,
  TransactionPathway,
  TransactionStage,
  type LogEvent,
} from "@ledgerhq/transaction-observability";
import { server } from "tests/server";
import { act, renderHook, waitFor, withFlagOverrides } from "tests/testSetup";
import { useEarnAppLifecycleMonitoring } from "./useEarnAppLifecycleMonitoring";

const intent: LogEvent = {
  status: "intent",
  stage: TransactionStage.Sign,
  appVersion: "lld/2.0.0",
  pathway: TransactionPathway.WalletApiSignAndBroadcast,
  manifestId: "earn",
  currencyId: "ethereum",
  family: "evm",
  currencyTicker: "ETH",
  isTestnet: false,
  isSendMax: false,
  dataSource: TransactionDataSource.Sign,
  rawTransactionType: "contract",
};

const settleRequests = () => act(() => new Promise(resolve => setTimeout(resolve, 50)));

describe("useEarnAppLifecycleMonitoring", () => {
  const posted: unknown[] = [];

  beforeEach(() => {
    posted.length = 0;
    server.use(
      http.post("https://earn.example.test/v1/tx/lifecycle", async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json({});
      }),
    );
    setTxLifecycleBaseUrl("https://earn.example.test");
    setEarnTxLifecycleFlagReader(() => true);
    registerTxLifecycleObserver("desktop");
  });

  afterEach(() => {
    resetTransactionObservers();
    clearPendingTxLifecycle("desktop");
    setEarnTxLifecycleFlagReader(null);
    setTxLifecycleBaseUrl(undefined);
  });

  it("should post one abandon on the earn path when the Earn webview unmounts with a sign pending", async () => {
    const { unmount } = renderHook(() => useEarnAppLifecycleMonitoring("earn"), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });
    emitTransactionEvent(intent);
    unmount();

    await waitFor(() =>
      expect(posted).toEqual([
        expect.objectContaining({
          event: "tx_terminal",
          outcome: "failure",
          failure_class: "abandoned",
          path: "earn",
          platform: "desktop",
        }),
      ]),
    );
  });

  it("should post nothing when the kill-switch is off, its default", async () => {
    const { unmount } = renderHook(() => useEarnAppLifecycleMonitoring("earn"));
    emitTransactionEvent(intent);
    unmount();
    await settleRequests();

    expect(posted).toEqual([]);
  });

  it("should post nothing for a webview that is not the Earn live app", async () => {
    const { unmount } = renderHook(() => useEarnAppLifecycleMonitoring("some-dapp"), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });
    emitTransactionEvent({ ...intent, manifestId: "some-dapp" });
    unmount();
    await settleRequests();

    expect(posted).toEqual([]);
  });
});
