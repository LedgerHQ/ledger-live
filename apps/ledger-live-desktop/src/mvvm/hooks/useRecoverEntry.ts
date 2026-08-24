import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { isNanoSOnlyWallet } from "@features/flow-large-screen-upsell";
import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { hasClickedRecoverSelector, devicesModelListSelector } from "~/renderer/reducers/settings";
import { setHasClickedRecover } from "~/renderer/actions/settings";

export function useRecoverEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const recoverFeature = useFeature("protectServicesDesktop");
  const recoverHomePath = useAccountPath(recoverFeature);
  const hasClickedRecover = useSelector(hasClickedRecoverSelector);
  const devicesModelList = useSelector(devicesModelListSelector);

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
    const liveAppPath = enabled && openRecoverFromSidebar && liveAppId && recoverHomePath;
    const lnsRecoverPath = enabled && isNanoSOnlyWallet(devicesModelList) && recoverHomePath;

    if (liveAppPath || lnsRecoverPath) {
      navigate(recoverHomePath, {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
        },
      });
      return;
    }

    if (enabled) {
      dispatch(openModal("MODAL_PROTECT_DISCOVER", undefined));
    }
  }, [
    markRecoverSeen,
    recoverFeature,
    recoverHomePath,
    devicesModelList,
    navigate,
    location.pathname,
    location.search,
    dispatch,
  ]);

  return { recoverFeature, hasClickedRecover, markRecoverSeen, openRecover };
}
