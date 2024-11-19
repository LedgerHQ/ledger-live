import { useSelector } from "react-redux";
import { accountsSelector } from "~/reducers/accounts";
import { useMemo } from "react";
import { usePTXCustomHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { getFee } from "../customHandlers/getFee";

export function useSwapLiveAppCustomHandlers(manifest: LiveAppManifest) {
  const accounts = useSelector(accountsSelector);
  const ptxCustomHandlers = usePTXCustomHandlers(manifest, accounts);

  return useMemo<WalletAPICustomHandlers>(
    () =>
      ({
        ...ptxCustomHandlers,
        "custom.getFee": getFee(accounts),
      }) as WalletAPICustomHandlers,
    [ptxCustomHandlers, accounts],
  );
}
