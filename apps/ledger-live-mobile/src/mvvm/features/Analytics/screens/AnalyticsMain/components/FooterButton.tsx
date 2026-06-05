import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { track } from "~/analytics";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { navigateToSwapTab } from "~/screens/Swap/navigation/navigateToSwapTab";
import { ANALYTICS_PAGE } from "../../../const";

const FooterButton: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const redirectToSwap = useCallback(() => {
    navigateToSwapTab({ navigation });
  }, [navigation]);

  const onPress = useCallback(() => {
    track("button_clicked", {
      button: "Swap",
      page: ANALYTICS_PAGE,
    });
    redirectToSwap();
  }, [redirectToSwap]);

  return (
    <Button appearance="base" size="md" onPress={onPress}>
      {t("analyticsAllocation.actions.swap")}
    </Button>
  );
};

export default React.memo(FooterButton);
