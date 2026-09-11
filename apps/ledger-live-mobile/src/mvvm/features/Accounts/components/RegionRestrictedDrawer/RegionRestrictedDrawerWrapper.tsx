import React, { useCallback } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  closeCurrencyRegionRestrictedDrawer,
  selectCurrencyRegionRestrictedDrawerCurrencyName,
  selectIsCurrencyRegionRestrictedDrawerOpen,
} from "~/reducers/currencyRegionRestrictedDrawer";
import { RegionRestrictedDrawer } from "./index";

export function RegionRestrictedDrawerWrapper() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsCurrencyRegionRestrictedDrawerOpen);
  const currencyName = useSelector(selectCurrencyRegionRestrictedDrawerCurrencyName);

  const onClose = useCallback(() => {
    dispatch(closeCurrencyRegionRestrictedDrawer());
  }, [dispatch]);

  return (
    <RegionRestrictedDrawer isOpen={isOpen} currencyName={currencyName ?? ""} onClose={onClose} />
  );
}
