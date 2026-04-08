import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardTrailing,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { HandCoins } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { track } from "~/analytics";

export const PortfolioLoansSection = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const handlePress = useCallback(() => {
    track("button_clicked", {
      button: "loans_entry_point",
      flow: "borrow",
      page: ScreenName.Portfolio,
    });
    navigation.navigate(NavigatorName.Borrow, { screen: ScreenName.Borrow });
  }, [navigation]);

  return (
    <Box
      lx={{
        paddingTop: "s32",
        paddingHorizontal: "s16",
      }}
    >
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s12" }}>
          <SubheaderTitle>{t("portfolio.loansEntry.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Box mt={2}>
        <Card onPress={handlePress} testID="portfolio-loans-entry-point">
          <CardHeader>
            <CardLeading>
              <Spot appearance="icon" icon={HandCoins} />
              <CardContent>
                <CardContentTitle>{t("portfolio.loansEntry.cardTitle")}</CardContentTitle>
                <CardContentDescription>
                  {t("portfolio.loansEntry.cardDescription")}
                </CardContentDescription>
              </CardContent>
            </CardLeading>
            <CardTrailing>
              <Button appearance="base" size="sm" onPress={handlePress} testID="loans-explore-cta">
                {t("portfolio.loansEntry.cta")}
              </Button>
            </CardTrailing>
          </CardHeader>
        </Card>
      </Box>
    </Box>
  );
};
