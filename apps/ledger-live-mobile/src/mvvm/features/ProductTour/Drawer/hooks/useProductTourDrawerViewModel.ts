import { useState, useCallback, useRef, useEffect } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { productTourCompletedSelector } from "~/reducers/settings";
import { productTourDeeplinkNonceSelector } from "~/reducers/appstate";
import type { ProductTourDrawerViewModel } from "../types";
import { track } from "~/analytics";
import { PAGE_TRACKING_PRODUCT_TOUR } from "../const";

export const useProductTourDrawerViewModel = (): ProductTourDrawerViewModel => {
  const currentIndexRef = useRef(0);
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const deeplinkNonce = useSelector(productTourDeeplinkNonceSelector);
  const lastHandledDeeplinkNonceRef = useRef(0);
  const lwmProductTour = useFeature("lwmProductTour");
  const isLWMProductTourEnabled = !!lwmProductTour?.enabled;
  const [isDrawerOpen, setIsDrawerOpen] = useState(
    !productTourCompleted && isLWMProductTourEnabled,
  );

  const openProductTour = useCallback(() => {
    if (!productTourCompleted && isLWMProductTourEnabled) {
      track("button_clicked", {
        button: "Open",
        page: PAGE_TRACKING_PRODUCT_TOUR,
      });
      setIsDrawerOpen(true);
    }
  }, [productTourCompleted, isLWMProductTourEnabled]);

  const closeProductTour = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      page: PAGE_TRACKING_PRODUCT_TOUR,
      card: currentIndexRef.current + 1,
    });
    setIsDrawerOpen(false);
  }, []);

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

  useEffect(() => {
    if (deeplinkNonce === 0) {
      return;
    }
    if (deeplinkNonce === lastHandledDeeplinkNonceRef.current) {
      return;
    }
    lastHandledDeeplinkNonceRef.current = deeplinkNonce;
    openProductTour();
  }, [deeplinkNonce, openProductTour]);

  return {
    isDrawerOpen,
    openProductTour,
    closeProductTour,
    onSlideChange,
  };
};
