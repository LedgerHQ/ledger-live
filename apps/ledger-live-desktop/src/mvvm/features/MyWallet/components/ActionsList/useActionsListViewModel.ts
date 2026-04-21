import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import {
  Gift,
  LifeRing,
  ShieldCheck,
  ShieldCheckNotification,
} from "@ledgerhq/lumen-ui-react/symbols";
import { track } from "~/renderer/analytics/segment";
import type { Action } from "./types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { hasClickedRecoverSelector } from "~/renderer/reducers/settings";
import { setHasClickedRecover } from "~/renderer/actions/settings";

export type ActionsListViewModel = {
  actions: Action[];
};

export function useActionsListViewModel(): ActionsListViewModel {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const referralProgramConfig = useFeature("referralProgramDesktopSidebar");
  const recoverFeature = useFeature("protectServicesDesktop");
  const recoverHomePath = useAccountPath(recoverFeature);
  const dispatch = useDispatch();
  const hasClickedRecover = useSelector(hasClickedRecoverSelector);
  const recoverIcon = hasClickedRecover ? ShieldCheck : ShieldCheckNotification;

  const openHelp = useCallback(() => {
    track("button_clicked", {
      button: "Help",
      page: location.pathname,
      entry: "my_wallet_actions_list",
    });
    navigate("/settings/help");
  }, [location.pathname, navigate]);

  const handleClickRecover = useCallback(() => {
    const enabled = recoverFeature?.enabled;
    const openRecoverFromSidebar = recoverFeature?.params?.openRecoverFromSidebar;
    const liveAppId = recoverFeature?.params?.protectId;

    if (!hasClickedRecover) {
      dispatch(setHasClickedRecover(true));
    }

    if (enabled && openRecoverFromSidebar && liveAppId && recoverHomePath) {
      navigate(recoverHomePath);
    } else if (enabled) {
      dispatch(openModal("MODAL_PROTECT_DISCOVER", undefined));
    }
    track("button_clicked", {
      button: "Recover",
      page: location.pathname,
      entry: "my_wallet_actions_list",
    });
  }, [
    recoverFeature?.enabled,
    recoverFeature?.params?.openRecoverFromSidebar,
    recoverFeature?.params?.protectId,
    recoverHomePath,
    hasClickedRecover,
    navigate,
    dispatch,
    location.pathname,
  ]);

  const handleClickRefer = useCallback(() => {
    if (referralProgramConfig?.enabled && referralProgramConfig?.params?.path) {
      navigate(referralProgramConfig.params.path);
      track("button_clicked", {
        button: "Refer",
        page: location.pathname,
        entry: "my_wallet_actions_list",
      });
    }
  }, [referralProgramConfig, navigate, location.pathname]);

  const actions: Action[] = [
    ...(recoverFeature?.enabled
      ? [
          {
            icon: recoverIcon,
            label: t("myWallet.actionsList.recover"),
            onClick: handleClickRecover,
            id: "recover",
          },
        ]
      : []),
    {
      icon: LifeRing,
      label: t("myWallet.actionsList.help"),
      onClick: openHelp,
      id: "help",
    },
    ...(referralProgramConfig?.enabled
      ? [
          {
            icon: Gift,
            label: t("myWallet.actionsList.refer"),
            onClick: handleClickRefer,
            id: "refer",
          },
        ]
      : []),
  ];

  return { actions };
}
