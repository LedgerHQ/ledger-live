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

  const navigateToRecover = useCallback(
    (path: string) => {
      navigate(path, {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        },
      });
    },
    [location.hash, location.pathname, location.search, navigate],
  );

  const openRecover = useCallback(() => {
    markRecoverSeen();

    const enabled = recoverFeature?.enabled;
    const protectId = recoverFeature?.params?.protectId;
    const recoverPath = recoverHomePath ?? (protectId ? `/recover/${protectId}` : undefined);
    const liveAppPath =
      enabled && recoverFeature?.params?.openRecoverFromSidebar && protectId && recoverHomePath;

    if (liveAppPath) {
      navigateToRecover(recoverHomePath);
      return;
    }

    if (enabled && isNanoSOnlyWallet(devicesModelList) && recoverPath) {
      navigateToRecover(recoverPath);
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
    navigateToRecover,
    dispatch,
  ]);

  return { recoverFeature, recoverHomePath, hasClickedRecover, markRecoverSeen, openRecover };
}
