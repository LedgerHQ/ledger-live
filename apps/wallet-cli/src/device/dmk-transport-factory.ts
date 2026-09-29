import type { TransportFactory } from "@ledgerhq/device-management-kit";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
import { readSpeculosConfig, type SpeculosConfig } from "./speculos-config";

let activeSpeculosUrl: string | undefined;

/**
 * The DMK transport wallet-cli runs on: Speculos when `SPECULOS_API_PORT` or `SPECULOS_ADDRESS` is
 * set, the given USB factory otherwise.
 */
export function walletCliTransportFactory(
  usb: TransportFactory,
  speculos: SpeculosConfig | null = readSpeculosConfig(),
): TransportFactory {
  activeSpeculosUrl = speculos?.url;
  if (!speculos) return usb;
  // E2E mode skips the disconnect polling that would keep the process alive.
  return speculosTransportFactory(speculos.url, true, speculos.deviceModelId);
}

/** URL of the Speculos the kit was built on; undefined on USB or before any kit exists. */
export function getActiveSpeculosUrl(): string | undefined {
  return activeSpeculosUrl;
}

/** Names the emulator in `disconnected` / `timeout` states, so their messages don't point at USB. */
export function speculosTarget(): { speculosUrl?: string } {
  return activeSpeculosUrl ? { speculosUrl: activeSpeculosUrl } : {};
}
