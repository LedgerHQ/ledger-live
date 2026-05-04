import { useState, useCallback, useRef, useEffect } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { productTourCompletedSelector } from "~/reducers/settings";
import type { ProductTourDrawerViewModel } from "../types";
import { track } from "~/analytics";
import { PAGE_TRACKING_PRODUCT_TOUR } from "../const";

export const useProductTourDrawerViewModel = (): ProductTourDrawerViewModel => {
  const currentIndexRef = useRef(0);
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const lwmProductTour = useFeature("lwmProductTour");
  const isLWMProductTourEnabled = !!lwmProductTour?.enabled;
  const [isDrawerOpen, setIsDrawerOpen] = useState(
    !productTourCompleted && isLWMProductTourEnabled,
  );

  const openDrawer = useCallback(() => {
    if (!productTourCompleted && isLWMProductTourEnabled) {
      setIsDrawerOpen(true);
    }
  }, [productTourCompleted, isLWMProductTourEnabled]);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const closeDrawer = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndexRef.current + 1,
    });
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const onSlideChange = useCallback((index: number) => {
    currentIndexRef.current = index;
    track("product_tour_card", {
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: index + 1,
    });
  }, []);

  useEffect(() => {
    if (isDrawerOpen && (productTourCompleted || !isLWMProductTourEnabled)) {
      setIsDrawerOpen(false);
    }
  }, [isDrawerOpen, productTourCompleted, isLWMProductTourEnabled]);

  return {
    productTourCompleted,
    isDrawerOpen,
    openDrawer,
    handleCloseDrawer,
    closeDrawer,
    onSlideChange,
  };
};
