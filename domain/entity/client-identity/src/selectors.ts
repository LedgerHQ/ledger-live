import type { IdentitiesState } from "./types";

export const userIdSelector = (state: { identities: IdentitiesState }) => state.identities.userId;

export const datadogIdSelector = (state: { identities: IdentitiesState }) =>
  state.identities.datadogId;
