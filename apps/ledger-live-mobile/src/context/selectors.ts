import {
  createStructuredSelector as createStructuredSelectorBase,
  createSelector as createSelectorBase,
} from "reselect";
import { State } from "~/reducers/types";

export const createStructuredSelector = createStructuredSelectorBase.withTypes<State>();
export const createSelector = createSelectorBase.withTypes<State>();
