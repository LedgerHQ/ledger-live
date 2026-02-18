import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenWalletV4Tour } from "~/actions/settings";
import { hasSeenWalletV4TourSelector } from "~/reducers/settings";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "../Drawer";
import { SectionCard, ToggleRow } from "./components";

function WalletV4TourScreenDebug() {
  const dispatch = useDispatch();

  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useWalletV4TourDrawer();

  const handleToggleHasSeenTour = useCallback(() => {
    dispatch(setHasSeenWalletV4Tour(!hasSeenTour));
  }, [dispatch, hasSeenTour]);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <SectionCard>
          <Text typography="body2" lx={{ color: "muted" }}>
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
          <Text typography="body2" lx={{ color: "muted" }}>
            {`Tour State: ${hasSeenTour ? "Completed" : "Not seen"}`}
          </Text>
        </SectionCard>
      </ScrollView>

      <View style={styles.footer}>
        <Button size="lg" appearance="accent" onPress={handleOpenDrawer}>
          {"Open Drawer"}
        </Button>
      </View>
      <WalletV4TourDrawer isDrawerOpen={isDrawerOpen} handleCloseDrawer={handleCloseDrawer} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
});

export default WalletV4TourScreenDebug;
