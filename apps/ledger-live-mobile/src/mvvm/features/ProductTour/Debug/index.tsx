import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { useDispatch, useSelector } from "~/context/hooks";
import { setProductTourCompleted } from "~/actions/settings";
import { productTourCompletedSelector } from "~/reducers/settings";
import { ProductTourControlsProvider } from "../context/ProductTourControlsContext";
import { useProductTourDrawer, ProductTourDrawer } from "../Drawer";
import { SectionCard, ToggleRow } from "./components";

const LWM_PRODUCT_TOUR_FLAG = "lwmProductTour";

function ProductTourScreenDebug() {
  const dispatch = useDispatch();
  const { getFeature, overrideFeature } = useFeatureFlags();

  const productTourCompleted = useSelector(productTourCompletedSelector);
  const lwmProductTourFeature = getFeature(LWM_PRODUCT_TOUR_FLAG);
  const isLwmProductTourEnabled = lwmProductTourFeature?.enabled ?? false;
  const {
    isDrawerOpen,
    openProductTour,
    closeProductTour,
    onCloseButtonPress,
    onSlideChange,
    onPrimaryAction,
    completeProductTour,
  } = useProductTourDrawer();

  const handleToggleProductTourCompleted = useCallback(() => {
    dispatch(setProductTourCompleted(!productTourCompleted));
  }, [dispatch, productTourCompleted]);

  const handleToggleLwmProductTourEnabled = useCallback(() => {
    overrideFeature(LWM_PRODUCT_TOUR_FLAG, {
      ...lwmProductTourFeature,
      enabled: !isLwmProductTourEnabled,
    });
  }, [lwmProductTourFeature, isLwmProductTourEnabled, overrideFeature]);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <SectionCard>
          <Text typography="body2" lx={{ color: "muted" }}>
            {"Allows you to test the UI of the Product Tour drawer."}
          </Text>
        </SectionCard>

        <SectionCard title="Feature Flag">
          <ToggleRow
            label="lwmProductTour enabled"
            value={isLwmProductTourEnabled}
            onChange={handleToggleLwmProductTourEnabled}
            description={
              isLwmProductTourEnabled
                ? "Feature flag is enabled. Toggle to disable."
                : "Feature flag is disabled. Toggle to enable."
            }
          />
        </SectionCard>

        <SectionCard title="Tour State">
          <ToggleRow
            label="Product Tour Completed"
            value={productTourCompleted}
            onChange={handleToggleProductTourCompleted}
            description={
              productTourCompleted
                ? "Tour has been completed. Toggle to reset."
                : "Tour has not been completed yet."
            }
          />
        </SectionCard>

        <SectionCard title="Current Configuration">
          <Text typography="body2" lx={{ color: "muted" }}>
            {`Tour State: ${productTourCompleted ? "Completed" : "Not completed"}`}
          </Text>
        </SectionCard>
      </ScrollView>

      <View style={styles.footer}>
        <Button size="lg" appearance="accent" onPress={openProductTour}>
          {"Open Drawer"}
        </Button>
      </View>

      <ProductTourControlsProvider
        value={{
          openProductTour,
          closeProductTour,
          onCloseButtonPress,
          onSlideChange,
          isDrawerOpen,
          onPrimaryAction,
          completeProductTour,
        }}
      >
        <ProductTourDrawer />
      </ProductTourControlsProvider>
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
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
});

export default ProductTourScreenDebug;
