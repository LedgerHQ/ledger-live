import { findReceiveAccount, type ReceiveToolTrigger } from "@devtools/bindings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openReceiveFlow, type OpenReceiveFlowData } from "LLD/features/Receive";
import { closeModal } from "~/renderer/actions/modals";
import { useDeepLinkHandler } from "~/renderer/hooks/useDeeplinking/useDeepLinkHandler";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { closeReceiveAddressDialog } from "@features/flow-receive/state";

export function useReceiveDevToolTrigger(): ReceiveToolTrigger {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const { handler } = useDeepLinkHandler();
  const reopenReceive = (data: OpenReceiveFlowData) => {
    dispatch(closeModal("MODAL_RECEIVE"));
    dispatch(closeReceiveAddressDialog());
    setTimeout(() => void dispatch(openReceiveFlow(data)));
  };
  return {
    onReceive: target => {
      const found = findReceiveAccount(accounts, target);
      if (found) reopenReceive({ ...found, sourcePage: "DevTools" });
    },
    onPickAsset: () => reopenReceive({ sourcePage: "DevTools" }),
    onOpenDeeplink: url => handler(url, false),
  };
}
