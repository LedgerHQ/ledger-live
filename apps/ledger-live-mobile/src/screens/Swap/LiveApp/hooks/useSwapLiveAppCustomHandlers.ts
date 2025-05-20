import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useSwapCustomHandlers } from "../customHandlers";

export function useSwapLiveAppCustomHandlers(manifest: LiveAppManifest) {
  const accounts = useSelector(flattenAccountsSelector);
  const dispatch = useDispatch();
  const swapCustomHandlers = useSwapCustomHandlers(manifest, accounts, dispatch);

  return useMemo<WalletAPICustomHandlers>(() => {
    return swapCustomHandlers as WalletAPICustomHandlers;
  }, [swapCustomHandlers]);
}
