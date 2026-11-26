import {
  LedgerSyncAnalyticsEvent,
  trackLedgerSyncActivated,
  trackLedgerSyncDeactivated,
  trackLedgerSyncRejectedOnDevice,
} from "./analytics";
import { flushAnalytics, listenToAnalytics, stopAnalytics } from "./__tests__/analytics";

afterEach(stopAnalytics);

describe("Ledger Sync analytics", () => {
  it("should track the activation with the flow the app passes", async () => {
    const vendor = listenToAnalytics();
    trackLedgerSyncActivated({ flow: "Ledger Sync" });
    await flushAnalytics();
    expect(vendor).toHaveBeenCalledWith("ledgersync_activated", { flow: "Ledger Sync" });
  });

  it("should track the activation without a flow when the app has none", async () => {
    const vendor = listenToAnalytics();
    trackLedgerSyncActivated({});
    await flushAnalytics();
    expect(vendor).toHaveBeenCalledWith("ledgersync_activated", {});
  });

  it("should track the deactivation without properties", async () => {
    const vendor = listenToAnalytics();
    trackLedgerSyncDeactivated();
    await flushAnalytics();
    expect(vendor).toHaveBeenCalledWith("ledgersync_deactivated", {});
  });

  it("should track a refusal on the device with the page, model and connection", async () => {
    const vendor = listenToAnalytics();
    trackLedgerSyncRejectedOnDevice({ modelId: "stax", connectionType: "USB" });
    await flushAnalytics();
    expect(vendor).toHaveBeenCalledWith(LedgerSyncAnalyticsEvent.rejectedOnDevice, {
      page: "Ledger Sync",
      modelId: "stax",
      connectionType: "USB",
    });
  });
});
