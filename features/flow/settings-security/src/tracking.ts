import { track } from "@shared/analytics";
import type { SecurityPlatform } from "./logic/securityRows";
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

/**
 * The events the legacy General screens send when the password or MEV protection state changes.
 * The password events are desktop's: the mobile screens never sent them.
 */
export function getSecurityStateEvents(
  values: Pick<SecuritySettingsValues, "passwordSet" | "mevProtection">,
  platform: SecurityPlatform,
): readonly SecurityStateEvent[] {
  const mevEvent = {
    id: "mevProtection",
    event: values.mevProtection ? "mev_activated" : "mev_disactivated",
  };
  if (platform === "mobile") return [mevEvent];

  return [
    { id: "appLock", event: values.passwordSet ? "PasswordEnabled" : "PasswordDisabled" },
    mevEvent,
  ];
}
