import { selectIsLocked } from "@features/platform-app-lock";
import { useIsFocused } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";

export function useIsScreenVisible(): boolean {
  const isFocused = useIsFocused();
  const isAppLocked = useSelector(selectIsLocked);

  return isFocused && !isAppLocked;
}
