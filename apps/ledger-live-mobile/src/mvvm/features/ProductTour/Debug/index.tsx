import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { useDispatch, useSelector } from "~/context/hooks";
import { setProductTourCompleted } from "~/actions/settings";
import { productTourCompletedSelector } from "~/reducers/settings";
import { ProductTourControlsProvider } from "../context/ProductTourControlsContext";
import { useProductTourDrawer, ProductTourDrawer } from "../Drawer";
import { SectionCard, ToggleRow } from "./components";

function ProductTourScreenDebug() {
  const dispatch = useDispatch();

  const productTourCompleted = useSelector(productTourCompletedSelector);
  const { isDrawerOpen, openProductTour, closeProductTour, onSlideChange } = useProductTourDrawer();

  const handleToggleProductTourCompleted = useCallback(() => {
    dispatch(setProductTourCompleted(!productTourCompleted));
  }, [dispatch, productTourCompleted]);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <SectionCard>
          <Text typography="body2" lx={{ color: "muted" }}>
            {"Allows you to test the UI of the Product Tour drawer."}
          </Text>
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
          onSlideChange,
          isDrawerOpen,
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
