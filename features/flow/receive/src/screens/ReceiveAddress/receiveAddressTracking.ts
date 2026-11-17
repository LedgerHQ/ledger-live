import { track } from "@shared/analytics";

/** The properties every event of the address screen carries; `source` is the entry point. */
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

export function trackReceiveAddressButton(button: string, tracking: ReceiveAddressTracking) {
  track("button_clicked", { button, ...tracking });
}
