import {
  readSpeculosTarget,
  type SpeculosTarget,
} from "@ledgerhq/live-dmk-shared/transport/speculosTarget";

/** Set by the APDU proxy, which relays a USB Ledger even when `SPECULOS_*` is set. */
let usbOnly = false;

export function setUsbOnly(value: boolean): void {
  usbOnly = value;
}

/** Speculos target the kit runs on, or `null` on USB. The APDU proxy always gets `null`. */
export function getActiveSpeculosTarget(): SpeculosTarget | null {
  return usbOnly ? null : readSpeculosTarget();
}

/** Names the emulator in `disconnected` / `timeout` states, so their messages don't point at USB. */
export function speculosTarget(): { speculosUrl?: string } {
  const target = getActiveSpeculosTarget();
  return target ? { speculosUrl: target.url } : {};
}
