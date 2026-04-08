import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useSelector } from "~/context/hooks";
import { isAgeVerifiedSelector } from "~/reducers/ageAttestation";
import {
  ListItem,
  ListItemLeading,
  ListItemSpot,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
  ListItemIcon,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";

export const PortfolioPassportEntryPoint = () => {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const isVerified = useSelector(isAgeVerifiedSelector);

  const handlePress = useCallback(() => {
    navigation.navigate(NavigatorName.PassportAttestation, {
      screen: ScreenName.PassportAttestationScanMRZ,
    });
  }, [navigation]);

  return (
    <>
      <Subheader>
        <SubheaderRow onPress={handlePress} data-testid="portfolio-passport-subheader-row">
          <SubheaderTitle>Identity</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Flex mb={6} mt={2}>
        <ListItem onPress={handlePress} testID="portfolio-passport-entry-point">
          <ListItemLeading>
            <ListItemSpot appearance="icon" icon={ShieldLock} />
            <ListItemContent>
              <ListItemTitle>
                {isVerified ? "Age Verified" : "Verify Your Age"}
              </ListItemTitle>
              <ListItemDescription>
                {isVerified
                  ? "ZK proof synced via TrustChain"
                  : "Scan passport for ZK age proof"}
              </ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
          <ListItemTrailing>
            <ListItemIcon icon={ChevronRight} />
          </ListItemTrailing>
        </ListItem>
      </Flex>
    </>
  );
};
