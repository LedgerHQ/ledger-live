import type { FinalFirmware } from "@ledgerhq/types-live";

export const hasFinalFirmware = (
  final: FinalFirmware | null | undefined
): boolean => Boolean(final && final?.firmware);
