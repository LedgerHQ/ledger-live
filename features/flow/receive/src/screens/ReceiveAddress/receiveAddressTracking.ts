import { track } from "@shared/analytics";

export const RECEIVE_ADDRESS_PAGE = { page: "Receive - Confirmation", flow: "receive" } as const;

export const SERVICE_WARNING_PAGE = "Receive - Infra Warning";

/** The `button` values of the address screen's `button_clicked` events, as the tracking plan names them. */
export type ReceiveAddressButton =
  | "copy address"
  | "share address"
  | "verify address"
  | "dismiss verify popover"
  | "public address"
  | "private address"
  | "help";

export function trackReceiveAddressButton(button: ReceiveAddressButton) {
  track("button_clicked", { button, ...RECEIVE_ADDRESS_PAGE });
}
