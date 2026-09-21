import { selectHasPassword, selectIsHydrated } from "@features/platform-app-lock";
import { useKeepProtection, type KeepProtection } from "../../hooks/useKeepProtection";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useRef } from "react";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";

export type AppLockPasswordRowViewModel = Readonly<{
  isHydrated: boolean;
  hasPassword: boolean;
  onValueChange: (enabled: boolean) => void;
}> &
  Pick<KeepProtection, "isRefusing" | "onRefusalClose">;

function useAppLockPasswordRowViewModel(): AppLockPasswordRowViewModel {
  const { navigate } = useNavigation();
  const isHydrated = useSelector(selectIsHydrated);
  const hasPassword = useSelector(selectHasPassword);
  const { isRefusing, onRefusalClose, allowRemoval } = useKeepProtection();
  const isPendingRef = useRef(false);

  const onValueChange = useCallback(
    async (enabled: boolean) => {
      track("toggle_clicked", {
        toggle: "Password Lock",
        page: ScreenName.GeneralSettings,
        enabled,
      });

      if (isPendingRef.current) {
        return;
      }

      isPendingRef.current = true;

      try {
        if (!enabled && !(await allowRemoval("password"))) {
          return;
        }

        navigate(enabled ? NavigatorName.PasswordAddFlow : NavigatorName.PasswordModifyFlow);
      } finally {
        isPendingRef.current = false;
      }
    },
    [allowRemoval, navigate],
  );

  return { isHydrated, hasPassword, onValueChange, isRefusing, onRefusalClose };
}

export default useAppLockPasswordRowViewModel;
