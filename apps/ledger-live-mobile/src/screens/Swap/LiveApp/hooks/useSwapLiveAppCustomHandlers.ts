import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePTXCustomHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { accountsSelector } from "~/reducers/accounts";
import { swapCustomHandlers } from "../customHandlers";
import { useNavigation } from "@react-navigation/native";

export function useSwapLiveAppCustomHandlers(manifest: LiveAppManifest) {
  const accounts = useSelector(accountsSelector);
  const ptxCustomHandlers = usePTXCustomHandlers(manifest, accounts);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  return useMemo<WalletAPICustomHandlers>(
    () =>
      ({
        ...ptxCustomHandlers,
        ...swapCustomHandlers({
          accounts,
          dispatch,
          navigation,
        }),
      }) as WalletAPICustomHandlers,
    [ptxCustomHandlers, accounts, dispatch, navigation],
  );
}
