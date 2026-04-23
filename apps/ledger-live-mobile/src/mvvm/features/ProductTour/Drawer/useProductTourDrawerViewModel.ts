import { useCallback, useState } from "react";
import type { ProductTourDrawerViewModel } from "./types";

export const useProductTourDrawerViewModel = (): ProductTourDrawerViewModel => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openProductTour = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeProductTour = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return {
    isDrawerOpen,
    openProductTour,
    closeProductTour,
  };
};
