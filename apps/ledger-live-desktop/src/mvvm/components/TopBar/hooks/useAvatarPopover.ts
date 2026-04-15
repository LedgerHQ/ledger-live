import { useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { openModal } from "~/renderer/actions/modals";
import { openInformationCenter } from "~/renderer/actions/UI";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { useSettings } from "./useSettings";
import { useMyLedger } from "./useMyLedger";

export const useAvatarPopover = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const { handleSettings } = useSettings();
  const { handleMyLedger, icon: myLedgerIcon } = useMyLedger();

  const recoverFeature = useFeature("protectServicesDesktop");
  const recoverHomePath = useAccountPath(recoverFeature);

  const close = useCallback(() => setOpen(false), []);

  const handleSettingsClick = useCallback(() => {
    close();
    handleSettings();
  }, [close, handleSettings]);

  const handleNotificationsClick = useCallback(() => {
    close();
    track("button_clicked2", {
      button: "Notification Center",
      page: location.pathname,
    });
    dispatch(openInformationCenter(undefined));
  }, [close, dispatch, location.pathname]);

  const handleRecoverClick = useCallback(() => {
    close();
    const enabled = recoverFeature?.enabled;
    const openRecoverFromSidebar = recoverFeature?.params?.openRecoverFromSidebar;
    const liveAppId = recoverFeature?.params?.protectId;

    if (enabled && openRecoverFromSidebar && liveAppId && recoverHomePath) {
      navigate(recoverHomePath);
    } else if (enabled) {
      dispatch(openModal("MODAL_PROTECT_DISCOVER", undefined));
    }
    track("button_clicked", { button: "recover", page: location.pathname });
  }, [close, recoverFeature, recoverHomePath, navigate, dispatch, location.pathname]);

  const handleHelpClick = useCallback(() => {
    close();
    setTrackingSource("avatar-popover");
    navigate("/settings/help");
  }, [close, navigate]);

  const handleMyLedgerClick = useCallback(() => {
    close();
    handleMyLedger();
  }, [close, handleMyLedger]);

  const handleExploreDevicesClick = useCallback(() => {
    close();
    track("button_clicked", { button: "explore_devices", page: location.pathname });
    window.open("https://shop.ledger.com", "_blank");
  }, [close, location.pathname]);

  return {
    open,
    setOpen,
    handleSettingsClick,
    handleNotificationsClick,
    handleRecoverClick,
    handleHelpClick,
    handleMyLedgerClick,
    handleExploreDevicesClick,
    myLedgerIcon,
    walletName: t("topBar.avatarPopover.walletName"),
    isRecoverEnabled: !!recoverFeature?.enabled,
    isIdentityEnabled: true,
  };
};
