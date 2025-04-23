import type { ChangeFlowPayload } from "~/renderer/reducers/hodlShield";

export const setFlow = (payload: ChangeFlowPayload) => ({
  type: "HODLSHIELD_CHANGE_FLOW",
  payload,
});

export const setDrawerVisibility = (payload: boolean) => ({
  type: "HODLSHIELD_CHANGE_DRAWER_VISIBILITY",
  payload,
});

export const setFaked = (payload: boolean) => ({
  type: "HODLSHIELD_FAKED",
  payload,
});
