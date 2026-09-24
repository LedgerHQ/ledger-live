import { selectHasPassword, selectIsHydrated } from "@features/platform-app-lock";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";

export type AppLockPasswordRowViewModel = Readonly<{
  isHydrated: boolean;
  hasPassword: boolean;
  onValueChange: (enabled: boolean) => void;
}>;

function useAppLockPasswordRowViewModel(): AppLockPasswordRowViewModel {
  const { navigate } = useNavigation();
  const isHydrated = useSelector(selectIsHydrated);
  const hasPassword = useSelector(selectHasPassword);

  const onValueChange = useCallback(
    (enabled: boolean) => {
      track("toggle_clicked", {
        toggle: "Password Lock",
        page: ScreenName.GeneralSettings,
        enabled,
      });

      navigate(enabled ? NavigatorName.PasswordAddFlow : NavigatorName.PasswordModifyFlow);
    },
    [navigate],
  );

  return { isHydrated, hasPassword, onValueChange };
}

export default useAppLockPasswordRowViewModel;
