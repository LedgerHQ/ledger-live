// @flow
import type { FinalFirmware } from "../types/manager";

export const hasFinalFirmware = (final: ?FinalFirmware): boolean =>
  Boolean(final && final?.firmware);
