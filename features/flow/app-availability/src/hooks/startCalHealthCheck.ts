import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { calHealthApi } from "./calHealthApi.internals";

type CalHealthDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export function startCalHealthCheck(dispatch: CalHealthDispatch) {
  return dispatch(calHealthApi.endpoints.checkCalHealth.initiate());
}
