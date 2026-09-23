import {
  installEarnLifecycleHost,
  isEarnTxLifecycleMonitoringEnabled,
  setEarnTxLifecycleFlagReader,
  startDappLifecycleMonitoring,
} from "./earnLifecycleHost";
import { setStakeProgramAppsReader } from "./stakingApps";
import { clearPendingTxLifecycle, setTxLifecycleBaseUrl } from "./txLifecycle";

describe("earn lifecycle host wiring", () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    clearPendingTxLifecycle("desktop");
    clearPendingTxLifecycle("mobile");
    setTxLifecycleBaseUrl("https://earn.example.test");
    process.env.LEDGER_CLIENT_VERSION = "ll/test";
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    setEarnTxLifecycleFlagReader(() => true);
  });

  afterEach(() => {
    clearPendingTxLifecycle("desktop");
    clearPendingTxLifecycle("mobile");
    setEarnTxLifecycleFlagReader(null);
    setStakeProgramAppsReader(null);
    setTxLifecycleBaseUrl(undefined);
    fetchSpy.mockRestore();
    delete process.env.LEDGER_CLIENT_VERSION;
  });

  const bodies = () =>
    fetchSpy.mock.calls.map(([, init]) => JSON.parse(String(init?.body))) as Record<
      string,
      unknown
    >[];

  it("opens a stake redirect attempt and abandons it when the webview goes away", () => {
    const close = startDappLifecycleMonitoring("desktop", "stakekit", true, true);
    expect(bodies()).toEqual([
      expect.objectContaining({ event: "tx_intent", path: "dapp", platform: "desktop" }),
    ]);

    close?.();

    expect(bodies().at(-1)).toMatchObject({
      event: "tx_terminal",
      outcome: "failure",
      failure_class: "abandoned",
    });
  });

  it("ignores an open that is not a stake redirect", () => {
    expect(startDappLifecycleMonitoring("mobile", "kiln-widget", false, true)).toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("drops the pending attempt instead of opening one when the kill-switch is off", () => {
    startDappLifecycleMonitoring("mobile", "kiln-widget", true, true);
    fetchSpy.mockClear();

    const close = startDappLifecycleMonitoring("mobile", "kiln-widget", true, false);
    close?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("injects the boot readers and clears pending attempts when the flag is turned off", () => {
    let enabled = true;
    const onStoreChange = installEarnLifecycleHost({
      platform: "desktop",
      readEnabled: () => enabled,
      readStakePrograms: () => ({
        enabled: true,
        params: { redirects: { ethereum: { platform: "not-this-version" } } },
      }),
      // The client only opens what its own version resolves, so that is what is monitored.
      resolveVersionedRedirects: () => ({
        enabled: true,
        params: { redirects: { ethereum: { platform: "future-stake-app" } } },
      }),
      readAppVersion: () => "2.0.0",
      apiBaseUrl: "https://staging.example.test/earn/",
    });

    expect(isEarnTxLifecycleMonitoringEnabled()).toBe(true);
    // Only the injected reader makes this remote-config app eligible for monitoring.
    const close = startDappLifecycleMonitoring("desktop", "future-stake-app", true, true);
    expect(bodies()).toHaveLength(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://staging.example.test/earn/v1/tx/lifecycle");
    fetchSpy.mockClear();

    enabled = false;
    onStoreChange();
    close?.();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
