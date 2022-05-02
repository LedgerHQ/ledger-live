// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import type { State } from ".";

export type RatingsState = {
  isRatingsModalOpen: boolean,
  currentRoute?: string,
  happyMoment?: any,
  dataOfUser?: any,
};

const initialState: RatingsState = {
  isRatingsModalOpen: false,
  currentRoute: null,
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
    { currentRoute }: { currentRoute?: string },
  ) => ({
    ...state,
    currentRoute,
  }),
  RATINGS_SET_HAPPY_MOMENT: (
    state: RatingsState,
    { happyMoment }: { happyMoment?: any },
  ) => ({
    ...state,
    happyMoment,
  }),
  RATINGS_SET_DATA_OF_USER: (
    state: RatingsState,
    { dataOfUser }: { dataOfUser?: any },
  ) => ({
    ...state,
    dataOfUser,
  }),
};

// Selectors
export const ratingsModalOpenSelector = (s: State) =>
  s.ratings.isRatingsModalOpen;

export const ratingsCurrentRouteSelector = (s: State) => s.ratings.currentRoute;

export const ratingsHappyMomentSelector = (s: State) => s.ratings.happyMoment;

export const ratingsDataOfUserSelector = (s: State) => s.ratings.dataOfUser;

export default handleActions(handlers, initialState);
