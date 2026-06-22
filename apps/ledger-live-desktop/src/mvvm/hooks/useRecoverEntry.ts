import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { hasClickedRecoverSelector } from "~/renderer/reducers/settings";
import { setHasClickedRecover } from "~/renderer/actions/settings";

export function useRecoverEntry() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const recoverFeature = useFeature("protectServicesDesktop");
  const recoverHomePath = useAccountPath(recoverFeature);
  const hasClickedRecover = useSelector(hasClickedRecoverSelector);

  const markRecoverSeen = useCallback(() => {
    if (!hasClickedRecover) {
      dispatch(setHasClickedRecover(true));
    }
  }, [hasClickedRecover, dispatch]);

  const openRecover = useCallback(() => {
    markRecoverSeen();

    const enabled = recoverFeature?.enabled;
    const openRecoverFromSidebar = recoverFeature?.params?.openRecoverFromSidebar;
    const liveAppId = recoverFeature?.params?.protectId;

    if (enabled && openRecoverFromSidebar && liveAppId && recoverHomePath) {
      navigate(recoverHomePath);
    } else if (enabled) {
      dispatch(openModal("MODAL_PROTECT_DISCOVER", undefined));
    }
  }, [markRecoverSeen, recoverFeature, recoverHomePath, navigate, dispatch]);

  return { recoverFeature, hasClickedRecover, markRecoverSeen, openRecover };
}
