import { findReceiveAccount, type ReceiveToolTrigger } from "@devtools/bindings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { useDeepLinkHandler } from "~/renderer/hooks/useDeeplinking/useDeepLinkHandler";
import type { ModalData } from "~/renderer/modals/types";
import { accountsSelector } from "~/renderer/reducers/accounts";

export function useReceiveDevToolTrigger(): ReceiveToolTrigger {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const { handler } = useDeepLinkHandler();
  const reopenReceive = (data: ModalData["MODAL_RECEIVE"]) => {
    dispatch(closeModal("MODAL_RECEIVE"));
    setTimeout(() => dispatch(openModal("MODAL_RECEIVE", data)));
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
