import React, { useCallback } from "react";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native-gesture-handler";
import { useTheme } from "styled-components/native";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenWalletV4Tour } from "~/actions/settings";
import { hasSeenWalletV4TourSelector } from "~/reducers/settings";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "../Drawer";
import { SectionCard, ToggleRow } from "./components";

function WalletV4TourScreenDebug() {
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useWalletV4TourDrawer();

  const handleToggleHasSeenTour = useCallback(() => {
    dispatch(setHasSeenWalletV4Tour(!hasSeenTour));
  }, [dispatch, hasSeenTour]);

  return (
    <Flex flex={1}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <SectionCard>
          <Text variant="body" color="neutral.c80" lineHeight="20px">
            {
              "Allows you to test the UI of the different drawer (Tour carrousel, Feature intro, prompt...)"
            }
          </Text>
        </SectionCard>

        <SectionCard title="Tour State">
          <ToggleRow
            label="Has Seen Wallet V4 Tour"
            value={hasSeenTour}
            onChange={handleToggleHasSeenTour}
            description={
              hasSeenTour
                ? "User has already seen the tour. Toggle to reset."
                : "User has not seen the tour yet."
            }
          />
        </SectionCard>

        <SectionCard title="Current Configuration">
          <Text variant="body" color="neutral.c80">
            <Text fontWeight="semiBold">{"Tour State: "}</Text>
            {hasSeenTour ? "Completed" : "Not seen"}
          </Text>
        </SectionCard>
      </ScrollView>

      <Flex
        px={4}
        pb={16}
        pt={2}
        backgroundColor="background.main"
        style={{
          shadowColor: colors.neutral.c100,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Button size="large" type="main" onPress={handleOpenDrawer}>
          {"Open Drawer"}
        </Button>
      </Flex>
      <WalletV4TourDrawer isDrawerOpen={isDrawerOpen} handleCloseDrawer={handleCloseDrawer} />
    </Flex>
  );
}

export default WalletV4TourScreenDebug;
