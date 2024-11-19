import React, { useCallback, useState } from "react";

const useCollectibles = () => {
  const [isPanAndZoomOpen, setPanAndZoomOpen] = useState(false);
  const openCollectiblesPanAndZoom: React.MouseEventHandler<HTMLDivElement> = useCallback(() => {
    setPanAndZoomOpen(true);
  }, [setPanAndZoomOpen]);
  const closeCollectiblesPanAndZoom = useCallback(() => {
    setPanAndZoomOpen(false);
  }, [setPanAndZoomOpen]);

  return { isPanAndZoomOpen, openCollectiblesPanAndZoom, closeCollectiblesPanAndZoom };
};

export default useCollectibles;
