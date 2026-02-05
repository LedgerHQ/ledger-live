import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";
import {
  ListItem,
  ListItemLeading,
  ListItemSpot,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
  ListItemIcon,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, PiggyBank } from "@ledgerhq/lumen-ui-rnative/symbols";
import { track } from "~/analytics";

export const PortfolioPerpsEntryPoint = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const handlePress = useCallback(() => {
    track("button_clicked", {
      button: "perps_entry_point",
      flow: "perps",
      page: ScreenName.Portfolio,
    });
    navigation.navigate(NavigatorName.Perps, { screen: ScreenName.PerpsTab });
  }, [navigation]);

  return (
    <FeatureToggle featureId="ptxPerpsLiveAppMobile">
      <Subheader>
        <SubheaderRow onPress={handlePress} data-testid="portfolio-perps-subheader-row">
          <SubheaderTitle>{t("portfolio.perpsEntry.title")}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>
      <Flex mb={6}>
        <ListItem onPress={handlePress} testID="portfolio-perps-entry-point">
          <ListItemLeading>
            <ListItemSpot appearance="icon" icon={PiggyBank} />
            <ListItemContent>
              <ListItemTitle>{t("portfolio.perpsEntry.description")}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
          <ListItemTrailing>
            <ListItemIcon icon={ChevronRight} />
          </ListItemTrailing>
        </ListItem>
      </Flex>
    </FeatureToggle>
  );
};
