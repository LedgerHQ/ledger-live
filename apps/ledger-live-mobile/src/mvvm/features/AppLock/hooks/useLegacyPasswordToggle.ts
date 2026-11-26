import { track } from "@shared/analytics";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { privacySelector } from "~/reducers/settings";

/**
 * The password switch of the legacy App lock: it shows the choice at once, tracks the press and
 * opens the legacy flow to add or remove the password, then follows the store when the screen
 * regains focus. Shared by the legacy Settings row and the new Security section.
 */
export function useLegacyPasswordToggle() {
  const privacy = useSelector(privacySelector);
  const { navigate } = useNavigation();

  const [isOn, setIsOn] = useState(!!privacy?.hasPassword);

  useFocusEffect(
    useCallback(() => {
      setIsOn(!!privacy?.hasPassword);
    }, [privacy?.hasPassword]),
  );

  const onValueChange = useCallback(
    (authSecurityEnabled: boolean): void => {
      track("toggle_clicked", {
        toggle: "Password Lock",
        page: ScreenName.GeneralSettings,
        enabled: !privacy?.hasPassword,
      });

      setIsOn(authSecurityEnabled);

      navigate(
        authSecurityEnabled ? NavigatorName.PasswordAddFlow : NavigatorName.PasswordModifyFlow,
      );
    },
    [navigate, privacy?.hasPassword],
  );

  return { privacy, isOn, onValueChange };
}
