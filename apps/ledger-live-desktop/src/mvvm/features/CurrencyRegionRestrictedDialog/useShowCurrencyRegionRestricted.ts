import { useEffect } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { setDrawer } from "~/renderer/drawers/Provider";
import { openCurrencyRegionRestrictedDialog } from "./currencyRegionRestrictedDialog";

/**
 * Hands the message over to the centered dialog: whichever surface detected the restriction is a
 * drawer the user cannot act in, so it gives way rather than rendering the message itself.
 */
export function useShowCurrencyRegionRestricted(restricted: boolean, currencyName: string) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!restricted) return;
    setDrawer();
    dispatch(openCurrencyRegionRestrictedDialog(currencyName));
  }, [restricted, currencyName, dispatch]);
}
