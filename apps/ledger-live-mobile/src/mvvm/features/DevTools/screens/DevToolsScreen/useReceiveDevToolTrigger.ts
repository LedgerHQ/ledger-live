import { Linking } from "react-native";
import { findReceiveAccount, type ReceiveToolTrigger } from "@devtools/bindings";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";

export function useReceiveDevToolTrigger(): ReceiveToolTrigger {
  const accounts = useSelector(accountsSelector);
  const { openReceiveForAccount, handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: ScreenName.DebugDevTools,
  });
  return {
    onReceive: target => {
      const found = findReceiveAccount(accounts, target);
      if (found) openReceiveForAccount(found.account, found.parentAccount);
    },
    onPickAsset: () => handleOpenReceiveDrawer(),
    onOpenDeeplink: url => Linking.openURL(url),
  };
}
