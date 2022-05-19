// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import type { State } from ".";
import type { RatingsHappyMoment, RatingsDataOfUser } from "../logic/ratings";

export type RatingsState = {
  /** Boolean indicating whether the ratings flow modal is opened or closed */
  isRatingsModalOpen: boolean,
  /** The route name of the current screen displayed in the app, it is updated every time the displayed screen change */
  currentRouteName?: string,
  /** The happy moment that triggered the oppening of the ratings modal */
  happyMoment?: RatingsHappyMoment,
  /** Data related to the user's app usage. We use this data to prompt the rating flow on certain conditions only */
  dataOfUser?: RatingsDataOfUser,
};

const initialState: RatingsState = {
  isRatingsModalOpen: false,
  currentRouteName: null,
  happyMoment: null,
  dataOfUser: null,
};

const handlers: Object = {
  RATINGS_SET_MODAL_OPEN: (
    state: RatingsState,
    { isRatingsModalOpen }: { isRatingsModalOpen: boolean },
  ) => ({
    ...state,
    isRatingsModalOpen,
  }),
  RATINGS_SET_CURRENT_ROUTE: (
    state: RatingsState,
    { currentRouteName }: { currentRouteName?: string },
  ) => ({
    ...state,
    currentRouteName,
  }),
  RATINGS_SET_HAPPY_MOMENT: (
    state: RatingsState,
    { happyMoment }: { happyMoment?: RatingsHappyMoment },
  ) => ({
    ...state,
    happyMoment,
  }),
  RATINGS_SET_DATA_OF_USER: (
    state: RatingsState,
    { dataOfUser }: { dataOfUser?: RatingsDataOfUser },
  ) => ({
    ...state,
    dataOfUser,
  }),
};

// Selectors
export const ratingsModalOpenSelector = (s: State) =>
  s.ratings.isRatingsModalOpen;

export const ratingsCurrentRouteNameSelector = (s: State) =>
  s.ratings.currentRouteName;

export const ratingsHappyMomentSelector = (s: State) => s.ratings.happyMoment;

export const ratingsDataOfUserSelector = (s: State) => s.ratings.dataOfUser;

export const satisfactionSelector = (s: State) =>
  s.ratings.dataOfUser?.satisfaction;

export default handleActions(handlers, initialState);
