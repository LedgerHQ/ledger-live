import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import { ledgerSyncHandler } from "../ledgerSync.handler";
import { createMockContext } from "./test-utils";

jest.mock("~/renderer/actions/walletSync", () => ({
  setDrawerVisibility: jest.fn(() => ({ type: "SET_DRAWER_VISIBILITY" })),
}));

const mockSetDrawerVisibility = jest.mocked(setDrawerVisibility);

describe("ledgerSync.handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ledgerSyncHandler", () => {
    it("navigates to settings display and opens Ledger Sync drawer", () => {
      const context = createMockContext();

      ledgerSyncHandler({ type: "ledgersync" }, context);

      expect(context.navigate).toHaveBeenCalledWith("/settings/display");
      expect(context.dispatch).toHaveBeenCalledWith(mockSetDrawerVisibility(true));
    });
  });
});
