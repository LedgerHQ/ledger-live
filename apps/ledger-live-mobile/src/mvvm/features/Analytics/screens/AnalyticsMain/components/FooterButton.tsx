import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { NavigatorName } from "~/const";
import { track } from "~/analytics";
import { ANALYTICS_PAGE } from "../../../const";

const FooterButton: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onPress = useCallback(() => {
    track("button_clicked", {
      button: "Swap",
      page: ANALYTICS_PAGE,
    });
    navigation.navigate(NavigatorName.Swap);
  }, [navigation]);

  return (
    <Button appearance="base" size="md" onPress={onPress}>
      {t("analyticsAllocation.actions.swap")}
    </Button>
  );
};

export default React.memo(FooterButton);
