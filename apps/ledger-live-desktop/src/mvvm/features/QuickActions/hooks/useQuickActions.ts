import { useCallback } from "react";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { ArrowDown, Plus, Minus, ArrowUp } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { areAccountsEmptySelector, hasAccountsSelector } from "~/renderer/reducers/accounts";
import { QuickAction } from "../types";

export const useQuickActions = (): { actionsList: QuickAction[] } => {
  const openSendFlow = useOpenSendFlow();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const hasAccount = useSelector(hasAccountsSelector);
  const hasFunds = !useSelector(areAccountsEmptySelector) && hasAccount;

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

    if (!hasAccount) {
      dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
      return;
    }

    dispatch(openModal("MODAL_RECEIVE", undefined));
  }, [dispatch, maybeRedirectToAccounts, hasAccount]);

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
    actionsList: [
      {
        title: t("quickActions.receive"),
        onAction: onReceive,
        icon: ArrowDown,
        disabled: false,
        buttonAppearance: "base",
      },
      {
        title: t("quickActions.buy"),
        onAction: onBuy,
        icon: Plus,
        disabled: false,
        buttonAppearance: "transparent",
      },
      {
        title: t("quickActions.sell"),
        onAction: onSell,
        icon: Minus,
        disabled: !hasFunds,
        buttonAppearance: "transparent",
      },
      {
        title: t("quickActions.send"),
        onAction: onSend,
        icon: ArrowUp,
        disabled: false,
        buttonAppearance: "transparent",
      },
    ],
  };
};
