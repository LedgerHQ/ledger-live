import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Gift,
  LifeRing,
  ShieldCheck,
  ShieldCheckNotification,
} from "@ledgerhq/lumen-ui-react/symbols";
import { track } from "~/renderer/analytics/segment";
import type { Action } from "./types";
import { useFeature } from "@features/platform-feature-flags";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { hasClickedRecoverSelector } from "~/renderer/reducers/settings";
import { setHasClickedRecover } from "~/renderer/actions/settings";
import { useContextMenuClose } from "../ContextMenuContext";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../constants";

export type ActionsListViewModel = {
  actions: Action[];
};

export function useActionsListViewModel(): ActionsListViewModel {
  const close = useContextMenuClose();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const referralProgramConfig = useFeature("referralProgramDesktopSidebar");
  const recoverFeature = useFeature("protectServicesDesktop");
  const recoverHomePath = useAccountPath(recoverFeature);
  const dispatch = useDispatch();
  const hasClickedRecover = useSelector(hasClickedRecoverSelector);
  const recoverIcon = hasClickedRecover ? ShieldCheck : ShieldCheckNotification;

  const openHelp = useCallback(() => {
    track("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.help,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    navigate("/settings/help");
    close();
  }, [navigate, close]);

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
      button: MY_WALLET_TRACKING_BUTTON.recover,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    close();
  }, [
    recoverFeature?.enabled,
    recoverFeature?.params?.openRecoverFromSidebar,
    recoverFeature?.params?.protectId,
    recoverHomePath,
    hasClickedRecover,
    navigate,
    dispatch,
    close,
  ]);

  const handleClickRefer = useCallback(() => {
    if (referralProgramConfig?.enabled && referralProgramConfig?.params?.path) {
      navigate(referralProgramConfig.params.path);
      track("button_clicked", {
        button: MY_WALLET_TRACKING_BUTTON.referral,
        page: MY_WALLET_TRACKING_PAGE_NAME,
      });
    }
    close();
  }, [referralProgramConfig, navigate, close]);

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
