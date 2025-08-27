import { createAction } from "redux-actions";
import type { InViewSetHasItemsPayload } from "./types";
import { InViewActionTypes } from "./types";

export const inViewSetHasItems = createAction<InViewSetHasItemsPayload>(
  InViewActionTypes.IN_VIEW_SET_HAS_ITEMS,
);
