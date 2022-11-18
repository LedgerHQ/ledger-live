import { createAction } from "redux-actions";
import type { RatingsHappyMoment, RatingsDataOfUser } from "../logic/ratings";
import type {
  RatingsDataOfUserPayload,
  RatingsSetCurrentRouteNamePayload,
  RatingsSetHappyMomentPayload,
  RatingsSetModalLockedPayload,
  RatingsSetModalOpenPayload,
} from "./types";
import { RatingsActionTypes } from "./types";

const setRatingsModalOpenAction = createAction<RatingsSetModalOpenPayload>(
  RatingsActionTypes.RATINGS_SET_MODAL_OPEN,
);
export const setRatingsModalOpen = (isRatingsModalOpen: boolean) =>
  setRatingsModalOpenAction({
    isRatingsModalOpen,
  });

const setRatingsModalLockedAction = createAction<RatingsSetModalLockedPayload>(
  RatingsActionTypes.RATINGS_SET_MODAL_LOCKED,
);
export const setRatingsModalLocked = (isRatingsModalLocked: boolean) =>
  setRatingsModalLockedAction({
    isRatingsModalLocked,
  });

const setRatingsCurrentRouteNameAction =
  createAction<RatingsSetCurrentRouteNamePayload>(
    RatingsActionTypes.RATINGS_SET_CURRENT_ROUTE_NAME,
  );
export const setRatingsCurrentRouteName = (currentRouteName?: string) =>
  setRatingsCurrentRouteNameAction({
    currentRouteName,
  });

const setRatingsHappyMomentAction = createAction<RatingsSetHappyMomentPayload>(
  RatingsActionTypes.RATINGS_SET_HAPPY_MOMENT,
);
export const setRatingsHappyMoment = (happyMoment?: RatingsHappyMoment) =>
  setRatingsHappyMomentAction({
    happyMoment,
  });

const setRatingsDataOfUserAction = createAction<RatingsDataOfUserPayload>(
  RatingsActionTypes.RATINGS_SET_DATA_OF_USER,
);
export const setRatingsDataOfUser = (dataOfUser?: RatingsDataOfUser) =>
  setRatingsDataOfUserAction({
    dataOfUser,
  });
