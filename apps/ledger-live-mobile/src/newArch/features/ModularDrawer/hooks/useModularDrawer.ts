import { useCallback, useState } from "react";

export const useModularDrawer = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
  };
};
