import { setDrawerVisibility as setLedgerSyncDrawerVisibility } from "~/renderer/actions/walletSync";
import { DeeplinkHandler } from "../types";

export const ledgerSyncHandler: DeeplinkHandler<"ledgersync"> = (
  _route,
  { navigate, dispatch },
) => {
  navigate("/settings/display");
  dispatch(setLedgerSyncDrawerVisibility(true));
};
