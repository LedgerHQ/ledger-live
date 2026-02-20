import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { NavigatorName } from "~/const";
import { track } from "~/analytics";
import { ANALYTICS_PAGE } from "../../../const";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

const FooterButton: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");

  const redirectToSwap = useCallback(() => {
    if (shouldDisplayWallet40MainNav) {
      navigation.navigate(NavigatorName.Main, {
        screen: NavigatorName.Swap,
      });
    } else {
      navigation.navigate(NavigatorName.Swap);
    }
  }, [navigation, shouldDisplayWallet40MainNav]);

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
