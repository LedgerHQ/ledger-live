import { useCallback, useRef } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { setDrawer } from "~/renderer/drawers/Provider";
import ModularDrawerFlowManager from "LLD/features/ModularDrawer/ModularDrawerFlowManager";
import { CloseButton } from "LLD/features/ModularDrawer/components/CloseButton";
import { useDispatch } from "react-redux";
import { closeModal, openModal } from "~/renderer/actions/modals";

type SendWorkflowProps = Readonly<{
  onClose?: () => void;
  params?: {
    account?: AccountLike;
    parentAccount?: Account;
  };
}>;

// Minimal orchestrator for the new Send flow.
// For now it only handles asset/network/account selection via the existing MAD.
export default function SendWorkflow({ onClose, params }: SendWorkflowProps) {
  const dispatch = useDispatch();
  const initializedRef = useRef(false);

  const handleAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      setDrawer();
      dispatch(closeModal("MODAL_SEND"));
      dispatch(
        openModal("MODAL_SEND", {
          account,
          parentAccount,
        }),
      );
    },
    [dispatch],
  );

  const handleDrawerClose = useCallback(() => {
    setDrawer();
    dispatch(closeModal("MODAL_SEND"));
    onClose?.();
  }, [dispatch, onClose]);

  if (!initializedRef.current && !params?.account) {
    initializedRef.current = true;

    setDrawer(
      ModularDrawerFlowManager,
      {
        currencies: [], // Show all currencies
        onAccountSelected: handleAccountSelected,
        drawerConfiguration: {
          assets: { leftElement: "undefined", rightElement: "balance", filter: "undefined" },
          networks: { leftElement: "undefined", rightElement: "undefined" },
        },
      },
      {
        onRequestClose: handleDrawerClose,
        closeButtonComponent: CloseButton,
      },
    );

    dispatch(closeModal("MODAL_SEND"));
  }

  return null;
}
