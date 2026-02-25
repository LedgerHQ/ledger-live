import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import Allocations from "~/screens/WalletCentricSections/Allocations";
import { NavigatorName, ScreenName } from "~/const";
import { LumenTextStyle, LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { track } from "~/analytics";
import { ANALYTICS_PAGE } from "../../../const";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AnalyticsNavigatorParamsList } from "../../../types";

const AssetAllocationBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AnalyticsNavigatorParamsList>>();

  const navigateToDetailedAllocation = useCallback(() => {
    track("button_clicked", {
      button: "Detailed Allocation",
      page: ANALYTICS_PAGE,
    });

    navigation.navigate(ScreenName.DetailedAllocation, {
      sourceScreenName: NavigatorName.Analytics,
    });
  }, [navigation]);

  return (
    <Box lx={Container}>
      <Text typography="heading5SemiBold" lx={TextStyle}>
        {t("analyticsAllocation.allocation.title")}
      </Text>
      <Allocations screenName={NavigatorName.Analytics} onPress={navigateToDetailedAllocation} />
    </Box>
  );
};

export default React.memo(AssetAllocationBanner);

const Container: LumenViewStyle = {
  flex: 1,
  marginTop: "s40",
  flexDirection: "column",
  gap: "s24",
};

const TextStyle: LumenTextStyle = {
  color: "base",
};
