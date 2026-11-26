import { StackActions, useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { selectIsLedgerSyncActive } from "@domain/entity-key-ring";
import { setLedgerSyncActivateDrawer } from "~/actions/walletSync";
import { NavigatorName, ScreenName } from "~/const";

export function LedgerSyncDeepLinkHandler() {
  const hasTrustchain = useSelector(selectIsLedgerSyncActive);
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
