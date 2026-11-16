import { findReceiveAccount, type ReceiveToolTrigger } from "@devtools/bindings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { useDeepLinkHandler } from "~/renderer/hooks/useDeeplinking/useDeepLinkHandler";
import { accountsSelector } from "~/renderer/reducers/accounts";

export function useReceiveDevToolTrigger(): ReceiveToolTrigger {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const { handler } = useDeepLinkHandler();
  return {
    onReceive: target => {
      const found = findReceiveAccount(accounts, target);
      if (found) dispatch(openModal("MODAL_RECEIVE", { ...found, sourcePage: "DevTools" }));
    },
    onPickAsset: () => dispatch(openModal("MODAL_RECEIVE", { sourcePage: "DevTools" })),
    onOpenDeeplink: url => handler(url, false),
  };
}
