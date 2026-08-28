import type { PreChecksState } from "./PreChecksState";
import { OsUpdatesSteps } from "./OsUpdatesSteps";

export type OsUpdatesProgress = {
  step: OsUpdatesSteps.PRE_CHECKS;
  state: PreChecksState;
};
