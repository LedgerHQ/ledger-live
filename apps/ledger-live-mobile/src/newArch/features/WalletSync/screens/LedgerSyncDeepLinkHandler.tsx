import { StackActions, useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { setLedgerSyncActivateDrawer } from "~/actions/walletSync";
import { NavigatorName, ScreenName } from "~/const";

export function LedgerSyncDeepLinkHandler() {
  const hasTrustchain = !!useSelector(trustchainSelector)?.rootId;
  const navigation = useNavigation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (hasTrustchain) {
      const routeName = NavigatorName.WalletSync;
      const screen = ScreenName.WalletSyncActivated;
      navigation.dispatch(StackActions.replace(routeName, { screen }));
    } else {
      const routeName = NavigatorName.Settings;
      const screen = ScreenName.GeneralSettings;
      navigation.dispatch(StackActions.replace(routeName, { screen }));
      dispatch(setLedgerSyncActivateDrawer(true));
    }
  }, [hasTrustchain, navigation, dispatch]);

  return null;
}
