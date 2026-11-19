import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { ledgerSyncHandler } from "../ledgerSync.handler";
import { createMockContext } from "./test-utils";

describe("ledgerSync.handler", () => {
  describe("ledgerSyncHandler", () => {
    it("navigates to settings display and opens Ledger Sync drawer", () => {
      const context = createMockContext();

      ledgerSyncHandler({ type: "ledgersync" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings/display");
      expect(context.dispatch).toHaveBeenLastCalledWith(setDrawerVisibility(true));
    });

    it("opens the Ledger Sync main screen when Ledger Sync is on", () => {
      const context = createMockContext({ hasLedgerSyncTrustchain: true });

      ledgerSyncHandler({ type: "ledgersync" }, context);

      expect(context.dispatch).toHaveBeenNthCalledWith(
        1,
        setFlow({ flow: Flow.LedgerSyncActivated, step: Step.LedgerSyncActivated }),
      );
      expect(context.dispatch).toHaveBeenNthCalledWith(2, setDrawerVisibility(true));
    });

    it("opens the activation screen when Ledger Sync is off", () => {
      const context = createMockContext({ hasLedgerSyncTrustchain: false });

      ledgerSyncHandler({ type: "ledgersync" }, context);

      expect(context.dispatch).toHaveBeenNthCalledWith(
        1,
        setFlow({ flow: Flow.Activation, step: Step.CreateOrSynchronize }),
      );
      expect(context.dispatch).toHaveBeenNthCalledWith(2, setDrawerVisibility(true));
    });

    it("keeps the current screen when Ledger Sync is faked", () => {
      const context = createMockContext({ hasLedgerSyncTrustchain: true, isLedgerSyncFaked: true });

      ledgerSyncHandler({ type: "ledgersync" }, context);

      expect(context.dispatch).toHaveBeenCalledTimes(1);
      expect(context.dispatch).toHaveBeenCalledWith(setDrawerVisibility(true));
    });
  });
});
