import { getWelcomeScreenFlow } from "LLD/features/WalletSync/hooks/useFlows";
import {
  setDrawerVisibility as setLedgerSyncDrawerVisibility,
  setFlow,
} from "~/renderer/actions/walletSync";
import { DeeplinkHandler } from "../types";

export const ledgerSyncHandler: DeeplinkHandler<"ledgersync"> = (
  _route,
  { navigate, dispatch, hasLedgerSyncTrustchain, isLedgerSyncFaked },
) => {
  navigate("/settings/display");
  if (!isLedgerSyncFaked) {
    dispatch(setFlow(getWelcomeScreenFlow({ hasTrustchain: hasLedgerSyncTrustchain })));
  }
  dispatch(setLedgerSyncDrawerVisibility(true));
};
