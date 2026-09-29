import type { TransportFactory } from "@ledgerhq/device-management-kit";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
import { readSpeculosConfig, type SpeculosConfig } from "./speculos-config";

/**
 * The DMK transport wallet-cli runs on: Speculos when `SPECULOS_API_PORT` or `SPECULOS_ADDRESS` is
 * set, the given USB factory otherwise.
 */
export function walletCliTransportFactory(
  usb: TransportFactory,
  speculos: SpeculosConfig | null = readSpeculosConfig(),
): TransportFactory {
  if (!speculos) return usb;
  // E2E mode skips the disconnect polling that would keep the process alive.
  return speculosTransportFactory(speculos.url, true, speculos.deviceModelId);
}
