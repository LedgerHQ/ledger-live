import { track } from "@shared/analytics";

export const RECEIVE_ADDRESS_PAGE = { page: "Receive - Confirmation", flow: "receive" } as const;

/** The `button` values of the address screen's `button_clicked` events, as the tracking plan names them. */
export type ReceiveAddressButton = "public address" | "private address";

export function trackReceiveAddressButton(button: ReceiveAddressButton) {
  track("button_clicked", { button, ...RECEIVE_ADDRESS_PAGE });
}
