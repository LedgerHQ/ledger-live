import React from "react";
import { CardLogoutView } from "./CardLogoutView";
import { useCardLogoutViewModel } from "./useCardLogoutViewModel";

/**
 * The Card's `More` menu, on its own: a tile-button that opens a sheet, and the sheet's `Logout` row
 * ends the session. It decides for itself whether it belongs on screen: it appears once a Card
 * session is live, and it renders nothing otherwise, so a caller can drop it beside `CardLogin` and
 * pass it nothing.
 *
 * Rendering nothing is not the same as leaving: the caller keeps this component mounted, so the
 * ViewModel holds its state across a whole login, logout and login again.
 */
export function CardLogout() {
  const logout = useCardLogoutViewModel();

  return logout ? <CardLogoutView {...logout} /> : null;
}
