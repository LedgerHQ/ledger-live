import { createAction } from "redux-actions";
import type {
  RatingsDataOfUserPayload,
  RatingsSetCurrentRouteNamePayload,
  RatingsSetHappyMomentPayload,
  RatingsSetModalLockedPayload,
  RatingsSetModalOpenPayload,
} from "./types";
import { RatingsActionTypes } from "./types";

export const setRatingsModalOpen = createAction<RatingsSetModalOpenPayload>(
  RatingsActionTypes.RATINGS_SET_MODAL_OPEN,
);
export const setRatingsModalLocked = createAction<RatingsSetModalLockedPayload>(
  RatingsActionTypes.RATINGS_SET_MODAL_LOCKED,
);
export const setRatingsCurrentRouteName =
  createAction<RatingsSetCurrentRouteNamePayload>(
    RatingsActionTypes.RATINGS_SET_CURRENT_ROUTE_NAME,
  );
export const setRatingsHappyMoment = createAction<RatingsSetHappyMomentPayload>(
  RatingsActionTypes.RATINGS_SET_HAPPY_MOMENT,
);
export const setRatingsDataOfUser = createAction<RatingsDataOfUserPayload>(
  RatingsActionTypes.RATINGS_SET_DATA_OF_USER,
);
