import { LkrpSdk } from "@shared/lkrp";
import type { LkrpSdkDependencies } from "@shared/lkrp";

export function createLkrpSdk(dependencies: LkrpSdkDependencies): LkrpSdk {
  return new LkrpSdk(dependencies);
}
