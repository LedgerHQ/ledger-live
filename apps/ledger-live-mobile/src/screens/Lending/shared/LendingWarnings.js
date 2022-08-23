// @flow
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

import { isAcceptedLendingTerms } from "../../../logic/terms";
import { NavigatorName, ScreenName } from "../../../const";

export default function LendingWarning() {
  const navigation = useNavigation();
  useEffect(() => {
    isAcceptedLendingTerms().then(
      hasAccepted =>
        !hasAccepted &&
        navigation.navigate(NavigatorName.LendingInfo, {
          screen: ScreenName.LendingTerms,
        }),
    );
  }, []);

  return null;
}
