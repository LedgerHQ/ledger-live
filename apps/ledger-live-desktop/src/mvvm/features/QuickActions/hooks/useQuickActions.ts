import { useCallback } from "react";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";

export const useQuickActions = () => {
  const openSendFlow = useOpenSendFlow();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const push = useCallback(
    (pathname: string) => {
      if (location.pathname === pathname) return;
      navigate(pathname);
    },
    [navigate, location.pathname],
  );

  const maybeRedirectToAccounts = useCallback(() => {
    return location.pathname === "/manager" && push("/accounts");
  }, [location.pathname, push]);

  const onSend = useCallback(() => {
    maybeRedirectToAccounts();
    openSendFlow();
  }, [maybeRedirectToAccounts, openSendFlow]);

  const onReceive = useCallback(() => {
    maybeRedirectToAccounts();
    dispatch(openModal("MODAL_RECEIVE", undefined));
  }, [dispatch, maybeRedirectToAccounts]);

  const onBuy = useCallback(() => {
    navigate("/exchange", {
      state: {
        mode: "buy",
      },
    });
  }, [navigate]);

  const onSell = useCallback(() => {
    navigate("/exchange", {
      state: {
        mode: "sell",
      },
    });
  }, [navigate]);

  return {
    onSend,
    onReceive,
    onBuy,
    onSell,
  };
};
