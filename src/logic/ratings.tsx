// @flow
import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { add, isBefore, formatISO } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import { accountsCountSelector } from "../reducers/accounts";
import {
  ratingsModalOpenSelector,
  ratingsCurrentRouteSelector,
  ratingsHappyMomentTimerSelector,
  ratingsDataOfUserSelector,
} from "../reducers/ratings";
import {
  setRatingsModalOpen,
  setRatingsCurrentRoute,
  setRatingsHappyMomentTimer,
} from "../actions/ratings";
import { languageSelector } from "../reducers/settings";

const ratingsDataOfUserAsyncStorageKey = "ratingsDataOfUser";

const getCurrentRoute = (
  state: NavigationState | Required<NavigationState["routes"][0]>["state"],
): Routes | undefined => {
  if (state.index === undefined || state.index < 0) {
    return undefined;
  }
  const nestedState = state.routes[state.index].state;
  if (nestedState !== undefined) {
    return getCurrentRoute(nestedState);
  }
  return state.routes[state.index].name;
};

export async function getRatingsDataOfUserFromStorage() {
  const ratingsDataOfUser = await AsyncStorage.getItem(
    ratingsDataOfUserAsyncStorageKey,
  );

  return JSON.parse(ratingsDataOfUser);
}

export async function setRatingsDataOfUserInStorage(ratingsDataOfUser) {
  await AsyncStorage.setItem(
    ratingsDataOfUserAsyncStorageKey,
    JSON.stringify(ratingsDataOfUser),
  );
}

const useRatings = () => {
  const ratings = {
    enabled: true,
    happy_moments: [
      {
        route_name: "ReceiveConfirmation",
        timer: 2000,
        type: "on_leave",
      },
      {
        route_name: "ClaimRewardsValidationSuccess",
        timer: 2000,
        type: "on_enter",
      },
      {
        route_name: "SendValidationSuccess",
        timer: 2000,
        type: "on_enter",
      },
      {
        route_name: "MarketDetail",
        timer: 3000,
        type: "on_enter",
      },
    ],
    conditions: {
      minimum_accounts_number: 0,
      minimum_app_starts_number: 3,
      minimum_duration_since_app_first_start: {
        days: 0,
      },
      minimum_number_of_app_starts_since_last_crash: 2,
    },
  }; // useFeature("learn"); // TODO : replace learn with ratings
  // TODO : factorize modal components display
  // TODO : analytics

  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const ratingsOldRoute = useSelector(ratingsCurrentRouteSelector);
  const ratingsHappyMomentTimer = useSelector(ratingsHappyMomentTimerSelector);
  const ratingsDataOfUser = useSelector(ratingsDataOfUserSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const currAppLanguage = useSelector(languageSelector);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const setRatingsModalOpenCallback = useCallback(
    isRatingsModalOpen => {
      dispatch(setRatingsModalOpen(isRatingsModalOpen));
    },
    [dispatch],
  );

  const areRatingsConditionsMet = useCallback(() => {
    if (currAppLanguage !== "en") return false;

    console.log("RATINGS DATA", ratingsDataOfUser);
    if (!ratingsDataOfUser) return false;

    // criterias depending on last answer to the ratings flow
    if (ratingsDataOfUser.alreadyRated) {
      // return false; // TODO : remettre
    }
    if (
      ratingsDataOfUser.dateOfNextAllowedRequest &&
      isBefore(Date.now(), ratingsDataOfUser.dateOfNextAllowedRequest)
    ) {
      return false;
    }

    // minimum accounts number criteria
    const minimumAccountsNumber: number =
      ratings?.conditions?.minimum_accounts_number;
    if (minimumAccountsNumber && accountsCount < minimumAccountsNumber) {
      return false;
    }

    // minimum app start number criteria
    const minimumAppStartsNumber: number =
      ratings?.conditions?.minimum_app_starts_number;
    if (ratingsDataOfUser.numberOfAppStarts < minimumAppStartsNumber) {
      return false;
    }

    // duration since first app start long enough criteria
    const minimumDurationSinceAppFirstStart: any =
      ratings?.conditions?.minimum_duration_since_app_first_start;
    const dateAllowedAfterAppFirstStart = add(
      ratingsDataOfUser?.appFirstStartDate,
      minimumDurationSinceAppFirstStart,
    );
    if (
      ratingsDataOfUser?.appFirstStartDate &&
      isBefore(Date.now(), dateAllowedAfterAppFirstStart)
    ) {
      return false;
    }

    // No crash in last session criteria
    const minimumNumberOfAppStartsSinceLastCrash: number =
      ratings?.conditions?.minimum_number_of_app_starts_since_last_crash;
    if (
      ratingsDataOfUser.numberOfAppStartsSinceLastCrash <
      minimumNumberOfAppStartsSinceLastCrash
    ) {
      return false;
    }

    return true;
  }, [
    currAppLanguage,
    ratingsDataOfUser,
    accountsCount,
    ratings?.conditions?.minimum_accounts_number,
    ratings?.conditions?.minimum_app_starts_number,
    ratings?.conditions?.minimum_duration_since_app_first_start,
    ratings?.conditions?.minimum_number_of_app_starts_since_last_crash,
  ]);

  const isHappyMomentTriggered = useCallback(
    (happyMoment: any, ratingsNewRoute?: string) =>
      (happyMoment.type === "on_enter" &&
        happyMoment.route_name === ratingsNewRoute) ||
      (happyMoment.type === "on_leave" &&
        happyMoment.route_name === ratingsOldRoute),
    [ratingsOldRoute],
  );

  const triggerRouteChange = useCallback(
    ratingsNewRoute => {
      if (!areRatingsConditionsMet()) return;
      console.log("CONDITIONS MET");

      if (ratingsHappyMomentTimer) {
        clearTimeout(ratingsHappyMomentTimer);
      }

      for (const happyMoment of ratings?.happy_moments) {
        if (isHappyMomentTriggered(happyMoment, ratingsNewRoute)) {
          const timer = setTimeout(() => {
            setRatingsModalOpenCallback(true);
          }, happyMoment.timer);
          dispatch(setRatingsHappyMomentTimer(timer));
        }
      }
      dispatch(setRatingsCurrentRoute(ratingsNewRoute));
    },
    [
      areRatingsConditionsMet,
      ratingsHappyMomentTimer,
      dispatch,
      ratings?.happy_moments,
      isHappyMomentTriggered,
      setRatingsModalOpenCallback,
    ],
  );

  useEffect(() => {
    if (!ratings?.enabled) return;

    navigation.addListener("state", e => {
      const navState = e?.data?.state;
      if (navState && navState.routeNames) {
        const currentRoute = getCurrentRoute(navState);
        triggerRouteChange(currentRoute);
      }
    });

    return () => {
      navigation.removeListener("state");
    };
  }, [navigation, ratings?.enabled, triggerRouteChange]);

  return [isRatingsModalOpen, setRatingsModalOpenCallback];
};

export default useRatings;
