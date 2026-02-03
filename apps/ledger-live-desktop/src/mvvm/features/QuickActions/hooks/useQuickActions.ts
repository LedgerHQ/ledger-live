import { useCallback } from "react";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { ArrowDown, Plus, Minus, ArrowUp } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { QuickAction } from "../types";
import { useOpenAssetFlow } from "../../ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "../../ModularDrawer";
import { track } from "~/renderer/analytics/segment";

export const useQuickActions = (trackingPageName: string): { actionsList: QuickAction[] } => {
  const openSendFlow = useOpenSendFlow();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { hasAccount, hasFunds } = useAccountStatus();

  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "quick_actions_receive",
    "MODAL_RECEIVE",
  );

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
    track("button_clicked", {
      button: "quick_action",
      flow: "send",
      page: trackingPageName,
    });
    maybeRedirectToAccounts();
    openSendFlow();
  }, [maybeRedirectToAccounts, openSendFlow, trackingPageName]);

  const onReceive = useCallback(() => {
    track("button_clicked", {
      button: "quick_action",
      flow: "receive",
      page: trackingPageName,
    });
    maybeRedirectToAccounts();

    if (!hasAccount) {
      openAssetFlow();
      return;
    }

    dispatch(openModal("MODAL_RECEIVE", undefined));
  }, [maybeRedirectToAccounts, hasAccount, dispatch, openAssetFlow, trackingPageName]);

  const onBuy = useCallback(() => {
    track("button_clicked", {
      button: "quick_action",
      flow: "buy",
      page: trackingPageName,
    });
    navigate("/exchange", {
      state: {
        mode: "buy",
      },
    });
  }, [navigate, trackingPageName]);

  const onSell = useCallback(() => {
    track("button_clicked", {
      button: "quick_action",
      flow: "sell",
      page: trackingPageName,
    });
    navigate("/exchange", {
      state: {
        mode: "sell",
      },
    });
  }, [navigate, trackingPageName]);

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
        disabled: !hasAccount,
        buttonAppearance: "transparent",
      },
    ],
  };
};
