import React from "react";
import { CardLogoutView } from "./CardLogoutView";
import { useCardLogoutViewModel } from "./useCardLogoutViewModel";

/**
 * The logout, on its own. It decides for itself whether it belongs on screen: it appears once a Card
 * session is live, and it renders nothing otherwise, so a caller can drop it beside `CardLogin` and
 * pass it nothing.
 */
export function CardLogout() {
  const logout = useCardLogoutViewModel();

  return logout ? <CardLogoutView {...logout} /> : null;
}
