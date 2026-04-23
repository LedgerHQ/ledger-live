import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "~/context/hooks";
import { productTourDeeplinkNonceSelector } from "~/reducers/appstate";
import type { ProductTourDrawerViewModel } from "./types";

export const useProductTourDrawerViewModel = (): ProductTourDrawerViewModel => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const deeplinkNonce = useSelector(productTourDeeplinkNonceSelector);
  const lastHandledDeeplinkNonceRef = useRef(0);

  const openProductTour = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeProductTour = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

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
  };
};
