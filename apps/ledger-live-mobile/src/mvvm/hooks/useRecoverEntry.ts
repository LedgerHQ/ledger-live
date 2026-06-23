import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector, useDispatch } from "~/context/hooks";
import { ScreenName } from "~/const";
import { lastConnectedDeviceSelector, hasClickedRecoverSelector } from "~/reducers/settings";
import { setHasClickedRecover } from "~/actions/settings";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

export const DEFAULT_PROTECT_ID = "protect-prod";

export function useRecoverEntry() {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasClickedRecover = useSelector(hasClickedRecoverSelector);
  const recoverFeature = useFeature("protectServicesMobile");
  const protectId = recoverFeature?.params?.protectId ?? DEFAULT_PROTECT_ID;

  const markRecoverSeen = useCallback(() => {
    if (!hasClickedRecover) {
      dispatch(setHasClickedRecover(true));
    }
  }, [hasClickedRecover, dispatch]);

  const openRecover = useCallback(() => {
    navigation.navigate(ScreenName.Recover, {
      platform: protectId,
      device: lastConnectedDevice ?? undefined,
    });
  }, [navigation, protectId, lastConnectedDevice]);

  return { protectId, hasClickedRecover, markRecoverSeen, openRecover };
}
