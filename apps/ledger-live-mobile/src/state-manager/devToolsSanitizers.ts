import type { Action } from "@reduxjs/toolkit";
import {
  redactCardApiAction,
  redactCardApiState,
  redactEarnApiAction,
  redactEarnApiState,
} from "@shared/api-services";

/** What the Redux dev tools may see: the Card and Earn slices and their actions are redacted. */
export const devToolsSanitizers = {
  actionSanitizer: <A extends Action>(action: A): A =>
    redactEarnApiAction(redactCardApiAction(action)),
  stateSanitizer: <S>(state: S): S => redactEarnApiState(redactCardApiState(state)),
};
