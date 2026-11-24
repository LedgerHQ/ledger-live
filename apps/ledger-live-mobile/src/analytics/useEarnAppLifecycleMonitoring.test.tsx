import React, { useEffect } from "react";
import {
  clearDismissedEarnAppSign,
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
import { server, http, HttpResponse } from "@tests/server";
import { act, render, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useEarnAppLifecycleMonitoring } from "./useEarnAppLifecycleMonitoring";

const intent: LogEvent = {
  status: "intent",
  stage: TransactionStage.Sign,
  appVersion: "llm/2.0.0",
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

const monitoringOn = withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } });

const teardownAbandon = expect.objectContaining({
  event: "tx_terminal",
  outcome: "failure",
  failure_class: "abandoned",
  path: "earn",
  platform: "mobile",
});

const settleRequests = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(100);
  });

function EarnWebviewHost({ children }: Readonly<{ children?: React.ReactNode }>) {
  useEarnAppLifecycleMonitoring("earn");
  return <>{children}</>;
}

/** Stands for the sign drawer inside the webview, whose sheet reports a close when it unmounts. */
function SignDrawerClosingOnUnmount() {
  useEffect(() => () => clearDismissedEarnAppSign("mobile", "earn"), []);
  return null;
}

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
    registerTxLifecycleObserver("mobile");
  });

  afterEach(() => {
    resetTransactionObservers();
    clearPendingTxLifecycle("mobile");
    setEarnTxLifecycleFlagReader(null);
    setTxLifecycleBaseUrl(undefined);
  });

  it("should post one abandon on the earn path when the Earn webview unmounts with a sign pending", async () => {
    const { unmount } = renderHook(() => useEarnAppLifecycleMonitoring("earn"), {
      overrideInitialState: monitoringOn,
    });
    emitTransactionEvent(intent);
    unmount();

    await waitFor(() => expect(posted).toEqual([teardownAbandon]));
  });

  it("should post nothing when the kill-switch is off, its default", async () => {
    const { unmount } = renderHook(() => useEarnAppLifecycleMonitoring("earn"));
    emitTransactionEvent(intent);
    unmount();
    await settleRequests();

    expect(posted).toEqual([]);
  });

  it("should post nothing when the sign drawer closes before the webview unmounts", async () => {
    const { rerender, unmount } = render(
      <EarnWebviewHost>
        <SignDrawerClosingOnUnmount />
      </EarnWebviewHost>,
      { overrideInitialState: monitoringOn },
    );
    emitTransactionEvent(intent);
    rerender(<EarnWebviewHost />);
    unmount();
    await settleRequests();

    expect(posted).toEqual([]);
  });

  it("should keep the teardown abandon when the sign drawer inside the webview closes on unmount", async () => {
    const { unmount } = render(
      <EarnWebviewHost>
        <SignDrawerClosingOnUnmount />
      </EarnWebviewHost>,
      { overrideInitialState: monitoringOn },
    );
    emitTransactionEvent(intent);
    unmount();

    await waitFor(() => expect(posted).toEqual([teardownAbandon]));
  });
});
