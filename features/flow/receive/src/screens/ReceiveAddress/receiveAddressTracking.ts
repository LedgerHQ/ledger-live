import { track } from "@shared/analytics";

export type ReceiveAddressTracking = Readonly<{
  page: "Receive - Confirmation";
  flow: "receive";
  source?: string;
}>;

export const toReceiveAddressTracking = (source?: string): ReceiveAddressTracking => ({
  page: "Receive - Confirmation",
  flow: "receive",
  source,
});

/** The `button` values of the address screen's `button_clicked` events, as the tracking plan names them. */
export type ReceiveAddressButton =
  | "close"
  | "copy address"
  | "share address"
  | "verify address"
  | "dismiss verify popover"
  | "public address"
  | "private address"
  | "service incident details"
  | "memo tag info"
  | "help"
  | "continue in legacy flow";

export function trackReceiveAddressButton(
  button: ReceiveAddressButton,
  tracking: ReceiveAddressTracking,
) {
  track("button_clicked", { button, ...tracking });
}
