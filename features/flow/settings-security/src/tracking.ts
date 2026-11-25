import { track } from "@shared/analytics";
import type { SecuritySettingsValues } from "./types";
import type { SecurityStateEvent } from "./Security.types";

const toggleState = (value: boolean) => (value ? "ON" : "OFF");

/** Same event as the discreet mode button of the top bar. */
export function trackHideBalanceToggle(value: boolean) {
  track("button_clicked", { button: "Discreet mode", toggle: toggleState(value) });
}

/** Same event as the legacy MEV protection toggle. */
export function trackMevProtectionToggle(value: boolean) {
  track(
    "toggle_clicked",
    { toggleAction: toggleState(value), toggle: "MEV", page: "Page Settings General" },
    { mandatory: true },
  );
}

/** The events the legacy General screen sends when the password or MEV protection state changes. */
export function getSecurityStateEvents(
  values: Pick<SecuritySettingsValues, "passwordSet" | "mevProtection">,
): readonly SecurityStateEvent[] {
  return [
    { id: "appLock", event: values.passwordSet ? "PasswordEnabled" : "PasswordDisabled" },
    { id: "mevProtection", event: values.mevProtection ? "mev_activated" : "mev_disactivated" },
  ];
}
