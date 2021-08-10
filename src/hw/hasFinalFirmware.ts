import type { FinalFirmware } from "../types/manager";
export const hasFinalFirmware = (
  final: FinalFirmware | null | undefined
): boolean => Boolean(final && final?.firmware);
