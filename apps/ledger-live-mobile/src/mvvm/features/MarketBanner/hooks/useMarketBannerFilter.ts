import { useCallback, useMemo, useState } from "react";
import { track } from "~/analytics";
import { useSelector } from "~/context/hooks";
import { selectMarketBannerRanking } from "~/reducers/marketBanner";
import type { MarketBannerRanking } from "~/reducers/types";
import { PAGE_NAME, BANNER_NAME } from "../constants";

export type MarketBannerFilterController = {
  filter: MarketBannerRanking;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

// Owns only the trigger; the drawer's options and selection handling belong to the drawer task.
export function useMarketBannerFilter(): MarketBannerFilterController {
  const filter = useSelector(selectMarketBannerRanking);
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback(() => {
    track("button_clicked", {
      button: "Market Banner Filter",
      page: PAGE_NAME,
      banner: BANNER_NAME,
    });
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return useMemo(() => ({ filter, isOpen, onOpen, onClose }), [filter, isOpen, onOpen, onClose]);
}
